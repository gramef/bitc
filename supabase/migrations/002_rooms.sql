-- ═══════════════════════════════════════════════════════════
-- BITC Live — Audio Rooms Migration
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  host_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT DEFAULT 'live' CHECK (status IN ('live', 'ended')),
  max_speakers INT DEFAULT 8,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Room participants table
CREATE TABLE IF NOT EXISTS room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  role TEXT DEFAULT 'listener' CHECK (role IN ('host', 'co_host', 'speaker', 'listener')),
  is_muted BOOLEAN DEFAULT true,
  hand_raised BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- 3. Enable realtime on both tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;

-- 4. RLS policies for rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms visible to all authenticated"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id);

-- 5. RLS policies for room_participants
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants visible to all authenticated"
  ON room_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join rooms"
  ON room_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON room_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Hosts can manage participants"
  ON room_participants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_participants.room_id
        AND rooms.host_id = auth.uid()
    )
  );

CREATE POLICY "Users can leave rooms"
  ON room_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Hosts can remove participants"
  ON room_participants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_participants.room_id
        AND rooms.host_id = auth.uid()
    )
  );
