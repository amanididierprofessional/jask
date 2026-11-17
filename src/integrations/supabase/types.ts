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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          parent_answer_id: string | null
          question_id: string
          upvotes: number
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          parent_answer_id?: string | null
          question_id: string
          upvotes?: number
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          parent_answer_id?: string | null
          question_id?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "answers_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_parent_answer_id_fkey"
            columns: ["parent_answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          created_at: string
          creator_id: string
          description: string
          id: string
          institution_id: string | null
          image_path: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string
          id?: string
          institution_id?: string | null
          image_path?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string
          id?: string
          institution_id?: string | null
          image_path?: string | null
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          department_id: string | null
          description: string | null
          id: string
          institution_id: string
          name: string
        }
        Insert: {
          code: string
          department_id?: string | null
          description?: string | null
          id?: string
          institution_id: string
          name: string
        }
        Update: {
          code?: string
          department_id?: string | null
          description?: string | null
          id?: string
          institution_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          campus: string | null
          code: string
          id: string
          institution_id: string
          name: string
          source_url: string | null
        }
        Insert: {
          campus?: string | null
          code: string
          id?: string
          institution_id: string
          name: string
          source_url?: string | null
        }
        Update: {
          campus?: string | null
          code?: string
          id?: string
          institution_id?: string
          name?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          created_at: string
          status: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          status?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      helper_invites: {
        Row: {
          created_at: string
          helper_id: string
          id: string
          inviter_id: string
          question_id: string
        }
        Insert: {
          created_at?: string
          helper_id: string
          id?: string
          inviter_id: string
          question_id: string
        }
        Update: {
          created_at?: string
          helper_id?: string
          id?: string
          inviter_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "helper_invites_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "helper_invites_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "helper_invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "helper_invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "helper_invites_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          created_at: string
          id: string
          name: string
          short_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          short_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          short_name?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          campus: boolean
          communities: boolean
          courses: boolean
          enabled: boolean
          push_enabled: boolean
          user_id: string
        }
        Insert: {
          campus?: boolean
          communities?: boolean
          courses?: boolean
          enabled?: boolean
          push_enabled?: boolean
          user_id: string
        }
        Update: {
          campus?: boolean
          communities?: boolean
          courses?: boolean
          enabled?: boolean
          push_enabled?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          push_sent_at: string | null
          question_id: string | null
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          push_sent_at?: string | null
          question_id?: string | null
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          push_sent_at?: string | null
          question_id?: string | null
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_references: {
        Row: {
          answer_id: string | null
          created_at: string
          id: string
          mime_type: string
          name: string
          owner_id: string
          path: string
          question_id: string
        }
        Insert: {
          answer_id?: string | null
          created_at?: string
          id?: string
          mime_type: string
          name: string
          owner_id: string
          path: string
          question_id: string
        }
        Update: {
          answer_id?: string | null
          created_at?: string
          id?: string
          mime_type?: string
          name?: string
          owner_id?: string
          path?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_references_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_references_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_references_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_references_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          department_id: string | null
          full_name: string
          grad_year: number | null
          id: string
          institution_id: string | null
          major: string | null
          onboarded: boolean
          role_title: string | null
          study_year: number | null
          studying_course_id: string | null
          studying_until: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department_id?: string | null
          full_name?: string
          grad_year?: number | null
          id: string
          institution_id?: string | null
          major?: string | null
          onboarded?: boolean
          role_title?: string | null
          study_year?: number | null
          studying_course_id?: string | null
          studying_until?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department_id?: string | null
          full_name?: string
          grad_year?: number | null
          id?: string
          institution_id?: string | null
          major?: string | null
          onboarded?: boolean
          role_title?: string | null
          study_year?: number | null
          studying_course_id?: string | null
          studying_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_studying_course_id_fkey"
            columns: ["studying_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      push_devices: {
        Row: {
          created_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_communities: {
        Row: {
          community_id: string
          question_id: string
        }
        Insert: {
          community_id: string
          question_id: string
        }
        Update: {
          community_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_communities_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_communities_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_votes: {
        Row: {
          created_at: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_votes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          accepted_answer_id: string | null
          answer_count: number
          author_id: string
          body: string
          course_id: string | null
          created_at: string
          id: string
          institution_id: string | null
          tag: string | null
          title: string
        }
        Insert: {
          accepted_answer_id?: string | null
          answer_count?: number
          author_id: string
          body?: string
          course_id?: string | null
          created_at?: string
          id?: string
          institution_id?: string | null
          tag?: string | null
          title: string
        }
        Update: {
          accepted_answer_id?: string | null
          answer_count?: number
          author_id?: string
          body?: string
          course_id?: string | null
          created_at?: string
          id?: string
          institution_id?: string | null
          tag?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_accepted_fk"
            columns: ["accepted_answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          answer_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          major: string | null
          role_title: string | null
          study_year: number | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          major?: string | null
          role_title?: string | null
          study_year?: number | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          major?: string | null
          role_title?: string | null
          study_year?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      community_activity: {
        Args: never
        Returns: {
          activity: number
          creator_id: string
          description: string
          id: string
          image_path: string | null
          institution_id: string
          members: number
          name: string
          participants: number
          posts: number
          slug: string
        }[]
      }
      ranked_questions: {
        Args: {
          campus_id?: string
          community?: string
          course_ids?: string[]
          search_text?: string
          sort_mode?: string
        }
        Returns: {
          accepted_answer_id: string | null
          answer_count: number
          author_id: string
          body: string
          course_id: string | null
          created_at: string
          id: string
          institution_id: string | null
          tag: string | null
          title: string
        }[]
        SetofOptions: {
          from: "*"
          to: "questions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
