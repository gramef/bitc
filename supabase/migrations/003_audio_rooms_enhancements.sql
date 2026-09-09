-- ═══════════════════════════════════════════════════════════
-- BITC Live — Audio Rooms Schema Enhancements (Phase 2)
-- ═══════════════════════════════════════════════════════════

-- 1. Extend rooms table with Figma attributes
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_icon TEXT DEFAULT 'groups';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_color TEXT DEFAULT '#228B6D';

-- 2. Room Moderators table
CREATE TABLE IF NOT EXISTS room_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- 3. Live Room Speaker Requests table
CREATE TABLE IF NOT EXISTS live_room_speaker_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- 4. Live Room Speaker Invitations table
CREATE TABLE IF NOT EXISTS live_room_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES profiles(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '5 minutes'),
  UNIQUE(room_id, invited_user_id)
);

-- 5. Enable Realtime on new tables
ALTER PUBLICATION supabase_realtime ADD TABLE room_moderators;
ALTER PUBLICATION supabase_realtime ADD TABLE live_room_speaker_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE live_room_invitations;

-- 6. RLS Policies for room_moderators
ALTER TABLE room_moderators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators visible to all authenticated"
  ON room_moderators FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Hosts can assign moderators"
  ON room_moderators FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_moderators.room_id
        AND rooms.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can remove moderators"
  ON room_moderators FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_moderators.room_id
        AND rooms.host_id = auth.uid()
    )
  );

-- 7. RLS Policies for live_room_speaker_requests
ALTER TABLE live_room_speaker_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requests visible to room participants"
  ON live_room_speaker_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create speaker requests for self"
  ON live_room_speaker_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests or hosts/mods can manage"
  ON live_room_speaker_requests FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = live_room_speaker_requests.room_id
        AND rooms.host_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM room_moderators
      WHERE room_moderators.room_id = live_room_speaker_requests.room_id
        AND room_moderators.user_id = auth.uid()
    )
  );

-- 8. RLS Policies for live_room_invitations
ALTER TABLE live_room_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invitations visible to involved users"
  ON live_room_invitations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = invited_user_id OR
    auth.uid() = invited_by OR
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = live_room_invitations.room_id
        AND rooms.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts and mods can create invitations"
  ON live_room_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = live_room_invitations.room_id
        AND rooms.host_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM room_moderators
      WHERE room_moderators.room_id = live_room_invitations.room_id
        AND room_moderators.user_id = auth.uid()
    )
  );

CREATE POLICY "Invited user can respond to invitation"
  ON live_room_invitations FOR UPDATE
  TO authenticated
  USING (auth.uid() = invited_user_id);
