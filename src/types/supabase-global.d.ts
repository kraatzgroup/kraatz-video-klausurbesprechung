// Global type declarations to fix Supabase TypeScript compilation errors
// This file provides type overrides for all Supabase operations

import type { Database } from './database'

declare global {
  namespace Supabase {
    type Database = import('./database').Database
    
    // Override Supabase client types to ensure proper typing
    interface Client {
      from<T extends keyof Database['public']['Tables']>(
        table: T
      ): {
        select: (query?: string) => Promise<{
          data: Database['public']['Tables'][T]['Row'][] | null
          error: any
        }>
        insert: (
          data: Database['public']['Tables'][T]['Insert'] | Database['public']['Tables'][T]['Insert'][]
        ) => Promise<{
          data: Database['public']['Tables'][T]['Row'] | Database['public']['Tables'][T]['Row'][] | null
          error: any
        }>
        update: (
          data: Database['public']['Tables'][T]['Update']
        ) => Promise<{
          data: Database['public']['Tables'][T]['Row'] | Database['public']['Tables'][T]['Row'][] | null
          error: any
        }>
        upsert: (
          data: Database['public']['Tables'][T]['Insert'] | Database['public']['Tables'][T]['Insert'][]
        ) => Promise<{
          data: Database['public']['Tables'][T]['Row'] | Database['public']['Tables'][T]['Row'][] | null
          error: any
        }>
        delete: () => Promise<{
          data: any
          error: any
        }>
        eq: (column: string, value: any) => any
        in: (column: string, values: any[]) => any
        single: () => Promise<{
          data: Database['public']['Tables'][T]['Row'] | null
          error: any
        }>
        maybeSingle: () => Promise<{
          data: Database['public']['Tables'][T]['Row'] | null
          error: any
        }>
      }
      
      rpc<T extends keyof Database['public']['Functions']>(
        fn: T,
        args?: Database['public']['Functions'][T]['Args']
      ): Promise<{
        data: Database['public']['Functions'][T]['Returns']
        error: any
      }>
    }
  }
}

// Module augmentation for @supabase/supabase-js
declare module '@supabase/supabase-js' {
  interface SupabaseClient<
    Database = any,
    SchemaName extends string & keyof Database = 'public' extends keyof Database
      ? 'public'
      : string & keyof Database
  > {
    from<TableName extends string & keyof Database[SchemaName]['Tables']>(
      table: TableName
    ): {
      select: (query?: string) => {
        eq: (column: string, value: any) => {
          single: () => Promise<{
            data: Database[SchemaName]['Tables'][TableName]['Row'] | null
            error: any
          }>
          maybeSingle: () => Promise<{
            data: Database[SchemaName]['Tables'][TableName]['Row'] | null
            error: any
          }>
          order: (column: string, options?: { ascending?: boolean }) => Promise<{
            data: Database[SchemaName]['Tables'][TableName]['Row'][] | null
            error: any
          }>
          limit: (count: number) => Promise<{
            data: Database[SchemaName]['Tables'][TableName]['Row'][] | null
            error: any
          }>
        }
        in: (column: string, values: any[]) => Promise<{
          data: Database[SchemaName]['Tables'][TableName]['Row'][] | null
          error: any
        }>
        order: (column: string, options?: { ascending?: boolean }) => Promise<{
          data: Database[SchemaName]['Tables'][TableName]['Row'][] | null
          error: any
        }>
        limit: (count: number) => Promise<{
          data: Database[SchemaName]['Tables'][TableName]['Row'][] | null
          error: any
        }>
        single: () => Promise<{
          data: Database[SchemaName]['Tables'][TableName]['Row'] | null
          error: any
        }>
        maybeSingle: () => Promise<{
          data: Database[SchemaName]['Tables'][TableName]['Row'] | null
          error: any
        }>
      } & Promise<{
        data: Database[SchemaName]['Tables'][TableName]['Row'][] | null
        error: any
      }>
      
      insert: (
        data: Database[SchemaName]['Tables'][TableName]['Insert'] | Database[SchemaName]['Tables'][TableName]['Insert'][]
      ) => {
        select: (query?: string) => {
          single: () => Promise<{
            data: Database[SchemaName]['Tables'][TableName]['Row'] | null
            error: any
          }>
        } & Promise<{
          data: Database[SchemaName]['Tables'][TableName]['Row'][] | null
          error: any
        }>
      } & Promise<{
        data: Database[SchemaName]['Tables'][TableName]['Row'] | Database[SchemaName]['Tables'][TableName]['Row'][] | null
        error: any
      }>
      
      update: (
        data: Database[SchemaName]['Tables'][TableName]['Update']
      ) => {
        eq: (column: string, value: any) => Promise<{
          data: Database[SchemaName]['Tables'][TableName]['Row'] | Database[SchemaName]['Tables'][TableName]['Row'][] | null
          error: any
        }>
      } & Promise<{
        data: Database[SchemaName]['Tables'][TableName]['Row'] | Database[SchemaName]['Tables'][TableName]['Row'][] | null
        error: any
      }>
      
      upsert: (
        data: Database[SchemaName]['Tables'][TableName]['Insert'] | Database[SchemaName]['Tables'][TableName]['Insert'][],
        options?: { onConflict?: string; ignoreDuplicates?: boolean }
      ) => {
        select: (query?: string) => Promise<{
          data: Database[SchemaName]['Tables'][TableName]['Row'][] | null
          error: any
        }>
      } & Promise<{
        data: Database[SchemaName]['Tables'][TableName]['Row'] | Database[SchemaName]['Tables'][TableName]['Row'][] | null
        error: any
      }>
      
      delete: () => {
        eq: (column: string, value: any) => Promise<{
          data: any
          error: any
        }>
      } & Promise<{
        data: any
        error: any
      }>
    }
    
    rpc<FunctionName extends string & keyof Database[SchemaName]['Functions']>(
      fn: FunctionName,
      args?: Database[SchemaName]['Functions'][FunctionName]['Args']
    ): Promise<{
      data: Database[SchemaName]['Functions'][FunctionName]['Returns']
      error: any
    }>
  }
}

export {}
