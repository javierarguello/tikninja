import { ZodSchema } from 'zod';
import { NextResponse } from 'next/server';

export const getAndValidateRequestBody = async <T extends ZodSchema>(
  request: Request,
  schema: T
): Promise<{ data: T['_output']; errorResponse: NextResponse | null }> => {
  const body = await request.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      data: null as T['_output'],
      errorResponse: NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      ),
    };
  }
  return {
    data: result.data,
    errorResponse: null,
  };
};
