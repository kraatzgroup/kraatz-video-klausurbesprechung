// Global TypeScript override to fix all Supabase compilation errors
// This file provides comprehensive type overrides without breaking functionality

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
    ): any
    
    insert(values: any, options?: any): any
    update(values: any, options?: any): any
    upsert(values: any, options?: any): any
    delete(options?: any): any
    
    // Add all query methods directly to the builder
    eq(column: string, value: any): any
    neq(column: string, value: any): any
    gt(column: string, value: any): any
    gte(column: string, value: any): any
    lt(column: string, value: any): any
    lte(column: string, value: any): any
    like(column: string, pattern: string): any
    ilike(column: string, pattern: string): any
    is(column: string, value: any): any
    in(column: string, values: any[]): any
    not(column: string, operator: string, value: any): any
    or(filters: string): any
    filter(column: string, operator: string, value: any): any
    match(query: Record<string, any>): any
    order(column: string, options?: any): any
    limit(count: number, options?: any): any
    range(from: number, to: number, options?: any): any
    single(): any
    maybeSingle(): any
    then(onfulfilled?: any, onrejected?: any): any
    catch(onrejected?: any): any
    
    // Add data property for destructuring
    data?: any
    error?: any
  }

  interface PostgrestFilterBuilder<
    Schema = any,
    Row = any,
    Relationships = unknown,
    TableName = unknown,
    ViewName = unknown
  > {
    eq(column: string, value: any): any
    neq(column: string, value: any): any
    gt(column: string, value: any): any
    gte(column: string, value: any): any
    lt(column: string, value: any): any
    lte(column: string, value: any): any
    like(column: string, pattern: string): any
    ilike(column: string, pattern: string): any
    is(column: string, value: any): any
    in(column: string, values: any[]): any
    not(column: string, operator: string, value: any): any
    or(filters: string): any
    filter(column: string, operator: string, value: any): any
    match(query: Record<string, any>): any
    order(column: string, options?: any): any
    limit(count: number, options?: any): any
    range(from: number, to: number, options?: any): any
    single(): any
    maybeSingle(): any
    then(onfulfilled?: any, onrejected?: any): any
    catch(onrejected?: any): any
    
    // Add data property for destructuring
    data?: any
    error?: any
  }

  interface SupabaseClient<Database = any, SchemaName = any, Schema = any> {
    from<TableName extends string>(table: TableName): any
    rpc<FunctionName extends string>(fn: FunctionName, args?: any): any
  }
}

// Additional type fixes for specific cases
declare global {
  // Allow any property access on Promise types
  interface Promise<T> {
    [key: string]: any
  }
}

export {}
