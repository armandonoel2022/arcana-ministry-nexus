export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      group_members: {
        Row: {
          created_at: string | null
          group_id: string | null
          id: string
          instrument: Database["public"]["Enums"]["instrument_type"]
          is_active: boolean | null
          is_leader: boolean | null
          joined_date: string | null
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      profiles: {
        Row: {
          address: string | null
          birthdate: string | null
          created_at: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string
          id: string
          is_active: boolean | null
          joined_date: string | null
          notes: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          birthdate?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          joined_date?: string | null
          notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          birthdate?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          joined_date?: string | null
          notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
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
      songs: {
        Row: {
          artist: string | null
          chords: string | null
          created_at: string | null
          created_by: string | null
          difficulty_level: number | null
          genre: string | null
          id: string
          is_active: boolean | null
          key_signature: string | null
          lyrics: string | null
          sheet_music_url: string | null
          spotify_link: string | null
          tags: string[] | null
          tempo: string | null
          title: string
          updated_at: string | null
          youtube_link: string | null
        }
        Insert: {
          artist?: string | null
          chords?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: number | null
          genre?: string | null
          id?: string
          is_active?: boolean | null
          key_signature?: string | null
          lyrics?: string | null
          sheet_music_url?: string | null
          spotify_link?: string | null
          tags?: string[] | null
          tempo?: string | null
          title: string
          updated_at?: string | null
          youtube_link?: string | null
        }
        Update: {
          artist?: string | null
          chords?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: number | null
          genre?: string | null
          id?: string
          is_active?: boolean | null
          key_signature?: string | null
          lyrics?: string | null
          sheet_music_url?: string | null
          spotify_link?: string | null
          tags?: string[] | null
          tempo?: string | null
          title?: string
          updated_at?: string | null
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
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_spanish_month_name: {
        Args: { date_input: string }
        Returns: string
      }
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
      song_knowledge: "unknown" | "learning" | "known" | "expert"
      user_role: "admin" | "leader" | "musician" | "vocalist" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
      ],
      song_knowledge: ["unknown", "learning", "known", "expert"],
      user_role: ["admin", "leader", "musician", "vocalist", "member"],
    },
  },
} as const
