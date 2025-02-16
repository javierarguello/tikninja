// create a test route that returns a json object

import { NextResponse } from 'next/server';
import { JobsService } from '@/services/JobsService';

export async function POST(request: Request) {
  const body = await request.json();
  console.log(body);

  const jobsService = new JobsService();
  const jobName = await jobsService.runVideoProcessingJob(body.scriptId);
  console.log(jobName);

  return NextResponse.json({ jobName });
}
