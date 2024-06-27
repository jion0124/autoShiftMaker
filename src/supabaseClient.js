import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iwesvxjdwtukmkigbgut.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZXN2eGpkd3R1a21raWdiZ3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk0MDc5MDUsImV4cCI6MjAzNDk4MzkwNX0.-mTu-Olsh7mNJ4uGa0HGxFKN-5hGJ8AMOQlOG1iBB0A'
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
