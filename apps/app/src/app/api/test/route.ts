// create a test route that returns a json object

import { NextResponse } from 'next/server';
import { v2 } from '@google-cloud/run';
export async function POST(request: Request) {
  const body = await request.json();
  console.log(body);

  const projectId = process.env.GCP_PROJECT_ID;
  const region = process.env.GCP_REGION;
  const jobName = process.env.VIDEO_PROCESSING_JOB_NAME;

  const client = new v2.JobsClient();

  const [response] = await client.runJob({
    name: `projects/${projectId}/locations/${region}/jobs/${jobName}`,
    overrides: {
      containerOverrides: [
        {
          args: ['dist/index.js', '--scriptId', body.scriptId],
        },
      ],
    },
  });

  console.log(response);

  return NextResponse.json({ message: 'Hello, world!' });
}
