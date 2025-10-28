export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bible_verses: {
        Row: {
          book: string
          chapter: number
          created_at: string
          id: string
          text: string
          updated_at: string
          verse: number
          version: string | null
        }
        Insert: {
          book: string
          chapter: number
          created_at?: string
          id?: string
          text: string
          updated_at?: string
          verse: number
          version?: string | null
        }
        Update: {
          book?: string
          chapter?: number
          created_at?: string
          id?: string
          text?: string
          updated_at?: string
          verse?: number
          version?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          actions: Json | null
          created_at: string | null
          id: string
          is_bot: boolean | null
          is_deleted: boolean | null
          message: string
          message_type: string | null
          room_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actions?: Json | null
          created_at?: string | null
          id?: string
          is_bot?: boolean | null
          is_deleted?: boolean | null
          message: string
          message_type?: string | null
          room_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actions?: Json | null
          created_at?: string | null
          id?: string
          is_bot?: boolean | null
          is_deleted?: boolean | null
          message?: string
          message_type?: string | null
          room_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_join_requests: {
        Row: {
          id: string
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          room_id: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_id: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_room_members: {
        Row: {
          can_leave: boolean | null
          id: string
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          can_leave?: boolean | null
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          can_leave?: boolean | null
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          department: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_moderated: boolean | null
          moderator_id: string | null
          name: string
          room_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_moderated?: boolean | null
          moderator_id?: string | null
          name: string
          room_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_moderated?: boolean | null
          moderator_id?: string | null
          name?: string
          room_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_verses: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          reflection: string | null
          updated_at: string
          verse_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          reflection?: string | null
          updated_at?: string
          verse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          reflection?: string | null
          updated_at?: string
          verse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_verses_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "bible_verses"
            referencedColumns: ["id"]
          },
        ]
      }
      dance_training: {
        Row: {
          completed_at: string | null
          created_at: string
          dance_style: string
          difficulty_level: number | null
          duration_minutes: number | null
          formation_type: string | null
          id: string
          instructor_feedback: string | null
          is_completed: boolean | null
          music_url: string | null
          notes: string | null
          performance_score: number | null
          routine_description: string | null
          routine_name: string
          target_movements: string[] | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          dance_style: string
          difficulty_level?: number | null
          duration_minutes?: number | null
          formation_type?: string | null
          id?: string
          instructor_feedback?: string | null
          is_completed?: boolean | null
          music_url?: string | null
          notes?: string | null
          performance_score?: number | null
          routine_description?: string | null
          routine_name: string
          target_movements?: string[] | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          dance_style?: string
          difficulty_level?: number | null
          duration_minutes?: number | null
          formation_type?: string | null
          id?: string
          instructor_feedback?: string | null
          is_completed?: boolean | null
          music_url?: string | null
          notes?: string | null
          performance_score?: number | null
          routine_description?: string | null
          routine_name?: string
          target_movements?: string[] | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      director_replacement_requests: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          original_director_id: string
          reason: string | null
          replacement_director_id: string
          requested_at: string
          responded_at: string | null
          service_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          original_director_id: string
          reason?: string | null
          replacement_director_id: string
          requested_at?: string
          responded_at?: string | null
          service_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          original_director_id?: string
          reason?: string | null
          replacement_director_id?: string
          requested_at?: string
          responded_at?: string | null
          service_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "director_replacement_requests_original_director_id_fkey"
            columns: ["original_director_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "director_replacement_requests_replacement_director_id_fkey"
            columns: ["replacement_director_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "director_replacement_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      director_replacements: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          original_director_id: string | null
          reason: string | null
          replacement_director_id: string | null
          requested_at: string
          responded_at: string | null
          service_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          original_director_id?: string | null
          reason?: string | null
          replacement_director_id?: string | null
          requested_at?: string
          responded_at?: string | null
          service_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          original_director_id?: string | null
          reason?: string | null
          replacement_director_id?: string | null
          requested_at?: string
          responded_at?: string | null
          service_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "director_replacements_original_director_id_fkey"
            columns: ["original_director_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "director_replacements_replacement_director_id_fkey"
            columns: ["replacement_director_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "director_replacements_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      event_program_items: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          event_id: string
          id: string
          item_order: number | null
          notes: string | null
          responsible_person: string | null
          time_slot: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          event_id: string
          id?: string
          item_order?: number | null
          notes?: string | null
          responsible_person?: string | null
          time_slot?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          event_id?: string
          id?: string
          item_order?: number | null
          notes?: string | null
          responsible_person?: string | null
          time_slot?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_program_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "special_events"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string | null
          group_id: string | null
          id: string
          instrument: Database["public"]["Enums"]["instrument_type"]
          is_active: boolean | null
          is_leader: boolean | null
          joined_date: string | null
          mic_order: number | null
          notes: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          instrument: Database["public"]["Enums"]["instrument_type"]
          is_active?: boolean | null
          is_leader?: boolean | null
          joined_date?: string | null
          mic_order?: number | null
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          instrument?: Database["public"]["Enums"]["instrument_type"]
          is_active?: boolean | null
          is_leader?: boolean | null
          joined_date?: string | null
          mic_order?: number | null
          notes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "worship_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      instrument_training: {
        Row: {
          audio_url: string | null
          completed_at: string | null
          created_at: string
          difficulty_level: number | null
          duration_minutes: number | null
          exercise_description: string | null
          exercise_name: string
          id: string
          instrument: string
          is_completed: boolean | null
          key_signature: string | null
          notes: string | null
          practice_score: number | null
          sheet_music_url: string | null
          target_techniques: string[] | null
          tempo: number | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          completed_at?: string | null
          created_at?: string
          difficulty_level?: number | null
          duration_minutes?: number | null
          exercise_description?: string | null
          exercise_name: string
          id?: string
          instrument: string
          is_completed?: boolean | null
          key_signature?: string | null
          notes?: string | null
          practice_score?: number | null
          sheet_music_url?: string | null
          target_techniques?: string[] | null
          tempo?: number | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          completed_at?: string | null
          created_at?: string
          difficulty_level?: number | null
          duration_minutes?: number | null
          exercise_description?: string | null
          exercise_name?: string
          id?: string
          instrument?: string
          is_completed?: boolean | null
          key_signature?: string | null
          notes?: string | null
          practice_score?: number | null
          sheet_music_url?: string | null
          target_techniques?: string[] | null
          tempo?: number | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      members: {
        Row: {
          apellidos: string
          cargo: Database["public"]["Enums"]["member_role"]
          celular: string | null
          contacto_emergencia: string | null
          created_at: string | null
          direccion: string | null
          email: string | null
          fecha_nacimiento: string | null
          grupo: Database["public"]["Enums"]["member_group"] | null
          id: string
          is_active: boolean | null
          nombres: string
          persona_reporte: string | null
          photo_url: string | null
          referencias: string | null
          telefono: string | null
          tipo_sangre: Database["public"]["Enums"]["blood_type"] | null
          updated_at: string | null
          voz_instrumento: string | null
        }
        Insert: {
          apellidos: string
          cargo: Database["public"]["Enums"]["member_role"]
          celular?: string | null
          contacto_emergencia?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          grupo?: Database["public"]["Enums"]["member_group"] | null
          id?: string
          is_active?: boolean | null
          nombres: string
          persona_reporte?: string | null
          photo_url?: string | null
          referencias?: string | null
          telefono?: string | null
          tipo_sangre?: Database["public"]["Enums"]["blood_type"] | null
          updated_at?: string | null
          voz_instrumento?: string | null
        }
        Update: {
          apellidos?: string
          cargo?: Database["public"]["Enums"]["member_role"]
          celular?: string | null
          contacto_emergencia?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          grupo?: Database["public"]["Enums"]["member_group"] | null
          id?: string
          is_active?: boolean | null
          nombres?: string
          persona_reporte?: string | null
          photo_url?: string | null
          referencias?: string | null
          telefono?: string | null
          tipo_sangre?: Database["public"]["Enums"]["blood_type"] | null
          updated_at?: string | null
          voz_instrumento?: string | null
        }
        Relationships: []
      }
      ministry_members: {
        Row: {
          created_at: string | null
          department: string | null
          id: string
          is_exempt_from_subscription: boolean | null
          notes: string | null
          position: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          id?: string
          is_exempt_from_subscription?: boolean | null
          notes?: string | null
          position: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          id?: string
          is_exempt_from_subscription?: boolean | null
          notes?: string | null
          position?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          agenda_notifications: boolean | null
          created_at: string
          director_replacement_notifications: boolean | null
          email_notifications: boolean | null
          id: string
          repertory_notifications: boolean | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agenda_notifications?: boolean | null
          created_at?: string
          director_replacement_notifications?: boolean | null
          email_notifications?: boolean | null
          id?: string
          repertory_notifications?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agenda_notifications?: boolean | null
          created_at?: string
          director_replacement_notifications?: boolean | null
          email_notifications?: boolean | null
          id?: string
          repertory_notifications?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_requests: {
        Row: {
          admin_notified: boolean | null
          created_at: string
          expires_at: string | null
          id: string
          requested_by: string | null
          status: string | null
          user_email: string
        }
        Insert: {
          admin_notified?: boolean | null
          created_at?: string
          expires_at?: string | null
          id?: string
          requested_by?: string | null
          status?: string | null
          user_email: string
        }
        Update: {
          admin_notified?: boolean | null
          created_at?: string
          expires_at?: string | null
          id?: string
          requested_by?: string | null
          status?: string | null
          user_email?: string
        }
        Relationships: []
      }
      personal_assistant_config: {
        Row: {
          created_at: string
          expense_categories: string[] | null
          id: string
          monthly_budget: number | null
          preferred_voice: string | null
          reminder_preferences: Json | null
          savings_goal: number | null
          updated_at: string
          user_id: string
          voice_commands_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          expense_categories?: string[] | null
          id?: string
          monthly_budget?: number | null
          preferred_voice?: string | null
          reminder_preferences?: Json | null
          savings_goal?: number | null
          updated_at?: string
          user_id: string
          voice_commands_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          expense_categories?: string[] | null
          id?: string
          monthly_budget?: number | null
          preferred_voice?: string | null
          reminder_preferences?: Json | null
          savings_goal?: number | null
          updated_at?: string
          user_id?: string
          voice_commands_enabled?: boolean | null
        }
        Relationships: []
      }
      personal_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          encrypted_notes: string | null
          expense_date: string
          expense_type: string
          id: string
          is_recurring: boolean | null
          recurring_frequency: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          encrypted_notes?: string | null
          expense_date?: string
          expense_type: string
          id?: string
          is_recurring?: boolean | null
          recurring_frequency?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          encrypted_notes?: string | null
          expense_date?: string
          expense_type?: string
          id?: string
          is_recurring?: boolean | null
          recurring_frequency?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          birthdate: string | null
          created_at: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          joined_date: string | null
          needs_password_change: boolean | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          repertory_view_preference: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          birthdate?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          is_approved?: boolean | null
          joined_date?: string | null
          needs_password_change?: boolean | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          repertory_view_preference?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          birthdate?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          joined_date?: string | null
          needs_password_change?: boolean | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          repertory_view_preference?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rehearsal_participants: {
        Row: {
          id: string
          invitation_status: string | null
          invited_by: string | null
          joined_at: string | null
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invitation_status?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          invitation_status?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rehearsal_participants_invited_by_fk"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rehearsal_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rehearsal_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rehearsal_participants_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rehearsal_sessions: {
        Row: {
          backing_track_url: string | null
          created_at: string
          created_by: string
          description: string | null
          group_id: string
          id: string
          is_published: boolean | null
          session_name: string | null
          song_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          backing_track_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          group_id: string
          id?: string
          is_published?: boolean | null
          session_name?: string | null
          song_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          backing_track_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          group_id?: string
          id?: string
          is_published?: boolean | null
          session_name?: string | null
          song_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rehearsal_sessions_created_by_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rehearsal_sessions_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      rehearsal_tracks: {
        Row: {
          audio_url: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          is_backing_track: boolean | null
          is_muted: boolean | null
          is_published: boolean | null
          participant_id: string | null
          session_id: string
          start_offset: number
          track_name: string | null
          track_type: string
          updated_at: string
          user_id: string
          video_url: string | null
          volume_level: number | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_backing_track?: boolean | null
          is_muted?: boolean | null
          is_published?: boolean | null
          participant_id?: string | null
          session_id: string
          start_offset?: number
          track_name?: string | null
          track_type: string
          updated_at?: string
          user_id: string
          video_url?: string | null
          volume_level?: number | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_backing_track?: boolean | null
          is_muted?: boolean | null
          is_published?: boolean | null
          participant_id?: string | null
          session_id?: string
          start_offset?: number
          track_name?: string | null
          track_type?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
          volume_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rehearsal_tracks_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "rehearsal_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rehearsal_tracks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rehearsal_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rehearsal_tracks_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          created_at: string
          created_by: string | null
          day_of_week: number
          description: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          notification_type: string
          target_audience: string | null
          time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day_of_week: number
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          notification_type?: string
          target_audience?: string | null
          time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day_of_week?: number
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          notification_type?: string
          target_audience?: string | null
          time?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_songs: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          service_id: string
          song_id: string
          song_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          service_id: string
          song_id: string
          song_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          service_id?: string
          song_id?: string
          song_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_songs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          assigned_group_id: string | null
          choir_breaks: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_confirmed: boolean | null
          leader: string | null
          location: string | null
          month_name: string | null
          month_order: number | null
          notes: string | null
          service_date: string
          service_type: string | null
          special_activity: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_group_id?: string | null
          choir_breaks?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_confirmed?: boolean | null
          leader?: string | null
          location?: string | null
          month_name?: string | null
          month_order?: number | null
          notes?: string | null
          service_date: string
          service_type?: string | null
          special_activity?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_group_id?: string | null
          choir_breaks?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_confirmed?: boolean | null
          leader?: string | null
          location?: string | null
          month_name?: string | null
          month_order?: number | null
          notes?: string | null
          service_date?: string
          service_type?: string | null
          special_activity?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_assigned_group_id_fkey"
            columns: ["assigned_group_id"]
            isOneToOne: false
            referencedRelation: "worship_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      song_selections: {
        Row: {
          created_at: string
          id: string
          notification_sent: boolean | null
          selected_by: string
          selection_reason: string | null
          service_id: string
          song_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_sent?: boolean | null
          selected_by: string
          selection_reason?: string | null
          service_id: string
          song_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_sent?: boolean | null
          selected_by?: string
          selection_reason?: string | null
          service_id?: string
          song_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_selections_selected_by_fkey"
            columns: ["selected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_selections_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_selections_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          artist: string | null
          chords: string | null
          created_at: string | null
          created_by: string | null
          difficulty_level: number | null
          director_notes: string | null
          genre: string | null
          id: string
          is_active: boolean | null
          key_signature: string | null
          last_used_date: string | null
          lyrics: string | null
          mood: string | null
          sheet_music_url: string | null
          spotify_link: string | null
          tags: string[] | null
          tempo: string | null
          theme: string | null
          title: string
          updated_at: string | null
          usage_count: number | null
          youtube_link: string | null
        }
        Insert: {
          artist?: string | null
          chords?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: number | null
          director_notes?: string | null
          genre?: string | null
          id?: string
          is_active?: boolean | null
          key_signature?: string | null
          last_used_date?: string | null
          lyrics?: string | null
          mood?: string | null
          sheet_music_url?: string | null
          spotify_link?: string | null
          tags?: string[] | null
          tempo?: string | null
          theme?: string | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
          youtube_link?: string | null
        }
        Update: {
          artist?: string | null
          chords?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: number | null
          director_notes?: string | null
          genre?: string | null
          id?: string
          is_active?: boolean | null
          key_signature?: string | null
          last_used_date?: string | null
          lyrics?: string | null
          mood?: string | null
          sheet_music_url?: string | null
          spotify_link?: string | null
          tags?: string[] | null
          tempo?: string | null
          theme?: string | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
          youtube_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "songs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      special_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          event_date: string
          event_type: string | null
          id: string
          location: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date: string
          event_type?: string | null
          id?: string
          location?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_type?: string | null
          id?: string
          location?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_category: string | null
          priority: number | null
          recipient_id: string | null
          scheduled_for: string | null
          sender_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_category?: string | null
          priority?: number | null
          recipient_id?: string | null
          scheduled_for?: string | null
          sender_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_category?: string | null
          priority?: number | null
          recipient_id?: string | null
          scheduled_for?: string | null
          sender_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_progress: {
        Row: {
          areas_to_improve: string[] | null
          created_at: string
          id: string
          instructor_notes: string | null
          performance_score: number | null
          session_date: string
          session_duration_minutes: number | null
          strengths: string[] | null
          training_id: string
          training_type: string
          user_id: string
          user_reflection: string | null
        }
        Insert: {
          areas_to_improve?: string[] | null
          created_at?: string
          id?: string
          instructor_notes?: string | null
          performance_score?: number | null
          session_date?: string
          session_duration_minutes?: number | null
          strengths?: string[] | null
          training_id: string
          training_type: string
          user_id: string
          user_reflection?: string | null
        }
        Update: {
          areas_to_improve?: string[] | null
          created_at?: string
          id?: string
          instructor_notes?: string | null
          performance_score?: number | null
          session_date?: string
          session_duration_minutes?: number | null
          strengths?: string[] | null
          training_id?: string
          training_type?: string
          user_id?: string
          user_reflection?: string | null
        }
        Relationships: []
      }
      user_musical_training: {
        Row: {
          created_at: string
          current_level: string
          exercises_completed: number
          id: string
          instrument: string
          streak_days: number
          updated_at: string
          user_id: string
          weekly_goal: number
        }
        Insert: {
          created_at?: string
          current_level?: string
          exercises_completed?: number
          id?: string
          instrument: string
          streak_days?: number
          updated_at?: string
          user_id: string
          weekly_goal?: number
        }
        Update: {
          created_at?: string
          current_level?: string
          exercises_completed?: number
          id?: string
          instrument?: string
          streak_days?: number
          updated_at?: string
          user_id?: string
          weekly_goal?: number
        }
        Relationships: []
      }
      user_song_knowledge: {
        Row: {
          id: string
          knowledge_level: Database["public"]["Enums"]["song_knowledge"] | null
          last_updated: string | null
          notes: string | null
          song_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          knowledge_level?: Database["public"]["Enums"]["song_knowledge"] | null
          last_updated?: string | null
          notes?: string | null
          song_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          knowledge_level?: Database["public"]["Enums"]["song_knowledge"] | null
          last_updated?: string | null
          notes?: string | null
          song_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_song_knowledge_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_song_knowledge_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verse_themes: {
        Row: {
          created_at: string | null
          id: string
          reflection: string | null
          theme_name: string
          updated_at: string | null
          verse_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reflection?: string | null
          theme_name: string
          updated_at?: string | null
          verse_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reflection?: string | null
          theme_name?: string
          updated_at?: string | null
          verse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verse_themes_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "bible_verses"
            referencedColumns: ["id"]
          },
        ]
      }
      vocal_training: {
        Row: {
          audio_url: string | null
          completed_at: string | null
          created_at: string
          difficulty_level: number | null
          duration_minutes: number | null
          exercise_description: string | null
          exercise_name: string
          id: string
          is_completed: boolean | null
          progress_notes: string | null
          target_skills: string[] | null
          updated_at: string
          user_id: string
          video_url: string | null
          voice_type: string
        }
        Insert: {
          audio_url?: string | null
          completed_at?: string | null
          created_at?: string
          difficulty_level?: number | null
          duration_minutes?: number | null
          exercise_description?: string | null
          exercise_name: string
          id?: string
          is_completed?: boolean | null
          progress_notes?: string | null
          target_skills?: string[] | null
          updated_at?: string
          user_id: string
          video_url?: string | null
          voice_type: string
        }
        Update: {
          audio_url?: string | null
          completed_at?: string | null
          created_at?: string
          difficulty_level?: number | null
          duration_minutes?: number | null
          exercise_description?: string | null
          exercise_name?: string
          id?: string
          is_completed?: boolean | null
          progress_notes?: string | null
          target_skills?: string[] | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
          voice_type?: string
        }
        Relationships: []
      }
      walkie_talkie_channels: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      walkie_talkie_transmissions: {
        Row: {
          audio_url: string | null
          channel_id: string
          created_at: string | null
          duration_seconds: number | null
          id: string
          transmission_type: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          channel_id: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          transmission_type?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          channel_id?: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          transmission_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "walkie_talkie_transmissions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "walkie_talkie_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walkie_talkie_transmissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worship_groups: {
        Row: {
          color_theme: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color_theme?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color_theme?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      service_selected_songs: {
        Row: {
          artist: string | null
          difficulty_level: number | null
          key_signature: string | null
          selected_at: string | null
          selected_by: string | null
          selected_by_name: string | null
          selection_reason: string | null
          service_date: string | null
          service_id: string | null
          service_leader: string | null
          service_title: string | null
          song_id: string | null
          song_title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "song_selections_selected_by_fkey"
            columns: ["selected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_selections_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_selections_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_rehearsal_file: {
        Args: { object_name: string }
        Returns: boolean
      }
      can_manage_rehearsal_file: {
        Args: { object_name: string }
        Returns: boolean
      }
      expire_pending_replacements: { Args: never; Returns: undefined }
      get_available_directors: {
        Args: { exclude_director_id: string }
        Returns: {
          email: string
          full_name: string
          id: string
          phone: string
        }[]
      }
      get_current_user_role: { Args: never; Returns: string }
      get_spanish_month_name: { Args: { date_input: string }; Returns: string }
      is_administrator: { Args: { _user_id: string }; Returns: boolean }
      is_participant_in_session: {
        Args: { _session_id: string; _user_id: string }
        Returns: boolean
      }
      is_room_moderator: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      process_scheduled_notifications: { Args: never; Returns: undefined }
    }
    Enums: {
      blood_type: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
      instrument_type:
        | "vocals"
        | "piano"
        | "guitar"
        | "bass"
        | "drums"
        | "percussion"
        | "saxophone"
        | "trumpet"
        | "violin"
        | "other"
      member_group:
        | "directiva"
        | "directores_alabanza"
        | "coristas"
        | "multimedia"
        | "danza"
        | "teatro"
        | "piso"
        | "grupo_massy"
        | "grupo_aleida"
        | "grupo_keyla"
        | "musicos"
      member_role:
        | "pastor"
        | "pastora"
        | "director_alabanza"
        | "directora_alabanza"
        | "corista"
        | "directora_danza"
        | "director_multimedia"
        | "camarografo"
        | "camarógrafa"
        | "encargado_piso"
        | "encargada_piso"
        | "musico"
        | "sonidista"
        | "encargado_luces"
        | "encargado_proyeccion"
        | "encargado_streaming"
        | "director_musical"
        | "danzarina"
      notification_type:
        | "general"
        | "agenda"
        | "repertory"
        | "director_replacement"
        | "song_selection"
        | "daily_verse"
        | "system"
        | "birthday_daily"
        | "birthday_monthly"
        | "director_replacement_request"
        | "director_replacement_response"
        | "director_change"
      song_knowledge: "unknown" | "learning" | "known" | "expert"
      user_role:
        | "admin"
        | "leader"
        | "musician"
        | "vocalist"
        | "member"
        | "administrator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      blood_type: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      instrument_type: [
        "vocals",
        "piano",
        "guitar",
        "bass",
        "drums",
        "percussion",
        "saxophone",
        "trumpet",
        "violin",
        "other",
      ],
      member_group: [
        "directiva",
        "directores_alabanza",
        "coristas",
        "multimedia",
        "danza",
        "teatro",
        "piso",
        "grupo_massy",
        "grupo_aleida",
        "grupo_keyla",
        "musicos",
      ],
      member_role: [
        "pastor",
        "pastora",
        "director_alabanza",
        "directora_alabanza",
        "corista",
        "directora_danza",
        "director_multimedia",
        "camarografo",
        "camarógrafa",
        "encargado_piso",
        "encargada_piso",
        "musico",
        "sonidista",
        "encargado_luces",
        "encargado_proyeccion",
        "encargado_streaming",
        "director_musical",
        "danzarina",
      ],
      notification_type: [
        "general",
        "agenda",
        "repertory",
        "director_replacement",
        "song_selection",
        "daily_verse",
        "system",
        "birthday_daily",
        "birthday_monthly",
        "director_replacement_request",
        "director_replacement_response",
        "director_change",
      ],
      song_knowledge: ["unknown", "learning", "known", "expert"],
      user_role: [
        "admin",
        "leader",
        "musician",
        "vocalist",
        "member",
        "administrator",
      ],
    },
  },
} as const
