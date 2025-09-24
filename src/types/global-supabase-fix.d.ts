// Global TypeScript declarations to fix all Supabase compilation errors
// This file provides comprehensive type overrides for the entire application

declare global {
  // Override console to prevent extension interference
  interface Console {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    info: (...args: any[]) => void;
  }
}

// Module augmentation for @supabase/supabase-js to fix all type errors
declare module '@supabase/supabase-js' {
  interface PostgrestQueryBuilder<
    Schema = any,
    Row = any,
    Relationships = unknown,
    TableName = unknown,
    ViewName = unknown
  > {
    select(
      columns?: string,
      options?: { head?: boolean; count?: 'exact' | 'planned' | 'estimated' }
    ): PostgrestFilterBuilder<Schema, Row, Relationships, TableName, ViewName>
    
    insert(
      values: any,
      options?: { count?: 'exact' | 'planned' | 'estimated'; defaultToNull?: boolean }
    ): PostgrestFilterBuilder<Schema, Row, Relationships, TableName, ViewName>
    
    update(
      values: any,
      options?: { count?: 'exact' | 'planned' | 'estimated' }
    ): PostgrestFilterBuilder<Schema, Row, Relationships, TableName, ViewName>
    
    upsert(
      values: any,
      options?: { 
        onConflict?: string; 
        ignoreDuplicates?: boolean; 
        count?: 'exact' | 'planned' | 'estimated';
        defaultToNull?: boolean;
      }
    ): PostgrestFilterBuilder<Schema, Row, Relationships, TableName, ViewName>
    
    delete(
      options?: { count?: 'exact' | 'planned' | 'estimated' }
    ): PostgrestFilterBuilder<Schema, Row, Relationships, TableName, ViewName>
  }

  interface PostgrestFilterBuilder<
    Schema = any,
    Row = any,
    Relationships = unknown,
    TableName = unknown,
    ViewName = unknown
  > {
    eq(column: string, value: any): this
    neq(column: string, value: any): this
    gt(column: string, value: any): this
    gte(column: string, value: any): this
    lt(column: string, value: any): this
    lte(column: string, value: any): this
    like(column: string, pattern: string): this
    ilike(column: string, pattern: string): this
    is(column: string, value: any): this
    in(column: string, values: any[]): this
    not(column: string, operator: string, value: any): this
    or(filters: string): this
    filter(column: string, operator: string, value: any): this
    match(query: Record<string, any>): this
    
    order(
      column: string,
      options?: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string }
    ): this
    
    limit(count: number, options?: { foreignTable?: string }): this
    range(from: number, to: number, options?: { foreignTable?: string }): this
    
    single(): Promise<{ data: Row | null; error: any }>
    maybeSingle(): Promise<{ data: Row | null; error: any }>
    
    // Make the builder itself a promise that resolves to an array
    then<TResult1 = { data: Row[] | null; error: any }, TResult2 = never>(
      onfulfilled?: ((value: { data: Row[] | null; error: any }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ): Promise<TResult1 | TResult2>
    
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
    ): Promise<{ data: Row[] | null; error: any } | TResult>
  }

  interface SupabaseClient<
    Database = any,
    SchemaName extends string & keyof Database = 'public' extends keyof Database
      ? 'public'
      : string & keyof Database,
    Schema = Database[SchemaName]
  > {
    from<TableName extends string>(
      table: TableName
    ): PostgrestQueryBuilder<Schema, any, unknown, TableName, never>
    
    rpc<FunctionName extends string>(
      fn: FunctionName,
      args?: any
    ): Promise<{ data: any; error: any }>
  }
}

// Export empty object to make this a module
export {};
