const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts');
const { EC2Client, DescribeInstancesCommand, DescribeVolumesCommand } = require('@aws-sdk/client-ec2');
const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');

async function assumeRole(roleArn, region = 'us-east-1') {
  const stsClient = new STSClient({ region });
  
  const command = new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: 'CloudCostAutopilot-' + Date.now(),
    DurationSeconds: 3600,
  });

  try {
    console.log(`Attempting to assume role: ${roleArn}`);
    const response = await stsClient.send(command);
    console.log('Successfully assumed role');
    return {
      accessKeyId: response.Credentials.AccessKeyId,
      secretAccessKey: response.Credentials.SecretAccessKey,
      sessionToken: response.Credentials.SessionToken,
      expiration: response.Credentials.Expiration,
    };
  } catch (error) {
    console.error('Error assuming role:', error.message);
    throw new Error(`Failed to assume role: ${error.message}`);
  }
}

async function listEC2Instances(credentials, region = 'us-east-1') {
  const ec2Client = new EC2Client({ region, credentials });
  const command = new DescribeInstancesCommand({});
  
  try {
    console.log(`Fetching EC2 instances in region: ${region}`);
    const response = await ec2Client.send(command);
    const instances = [];
    
    response.Reservations?.forEach(reservation => {
      reservation.Instances?.forEach(instance => {
        const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
        instances.push({
          instanceId: instance.InstanceId,
          instanceType: instance.InstanceType,
          state: instance.State.Name,
          launchTime: instance.LaunchTime,
          availabilityZone: instance.Placement?.AvailabilityZone,
          name: nameTag?.Value || 'Unnamed',
          tags: instance.Tags || [],
        });
      });
    });
    
    console.log(`Found ${instances.length} EC2 instances`);
    return instances;
  } catch (error) {
    console.error('Error listing EC2 instances:', error.message);
    throw new Error(`Failed to list EC2 instances: ${error.message}`);
  }
}

async function getCPUUtilization(credentials, instanceId, region = 'us-east-1') {
  const cloudWatchClient = new CloudWatchClient({ region, credentials });

  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);

  const command = new GetMetricStatisticsCommand({
    Namespace: 'AWS/EC2',
    MetricName: 'CPUUtilization',
    Dimensions: [{ Name: 'InstanceId', Value: instanceId }],
    StartTime: startTime,
    EndTime: endTime,
    Period: 86400,
    Statistics: ['Average', 'Maximum'],
  });

  try {
    console.log(`Fetching CPU metrics for instance: ${instanceId}`);
    const response = await cloudWatchClient.send(command);
    
    let avgCPU = 0;
    let maxCPU = 0;
    
    if (response.Datapoints && response.Datapoints.length > 0) {
      const totalAvg = response.Datapoints.reduce((sum, dp) => sum + (dp.Average || 0), 0);
      avgCPU = totalAvg / response.Datapoints.length;
      maxCPU = Math.max(...response.Datapoints.map(dp => dp.Maximum || 0));
    }

    console.log(`CPU metrics - Avg: ${avgCPU.toFixed(2)}%, Max: ${maxCPU.toFixed(2)}%`);
    
    return {
      datapoints: response.Datapoints,
      averageCPU: avgCPU,
      maximumCPU: maxCPU,
      datapointCount: response.Datapoints.length,
    };
  } catch (error) {
    console.error(`Error getting CPU metrics for ${instanceId}:`, error.message);
    throw new Error(`Failed to get CPU metrics: ${error.message}`);
  }
}

async function testConnection(roleArn, region = 'us-east-1') {
  try {
    const credentials = await assumeRole(roleArn, region);
    const instances = await listEC2Instances(credentials, region);
    return {
      success: true,
      message: 'Connection successful',
      instanceCount: instances.length,
      credentialsExpire: credentials.expiration,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error,
    };
  }
}

async function listUnattachedEBSVolumes(credentials, region = 'us-east-1') {
  const ec2Client = new EC2Client({ region, credentials });

  const command = new DescribeVolumesCommand({
    Filters: [{ Name: 'status', Values: ['available'] }]
  });

  try {
    console.log(`[EBS] Fetching unattached EBS volumes in region: ${region}`);
    const response = await ec2Client.send(command);
    const volumes = response.Volumes.map(vol => ({
      volumeId: vol.VolumeId,
      sizeGb: vol.Size,
      volumeType: vol.VolumeType,
      state: vol.State,
      monthlyCost: parseFloat((vol.Size * 0.08).toFixed(2)),
    }));
    console.log(`[EBS] Found ${volumes.length} unattached volumes`);
    return volumes;
  } catch (error) {
    console.error('[EBS] Error listing EBS volumes:', error.message);
    throw new Error(`Failed to list EBS volumes: ${error.message}`);
  }
}

module.exports = {
  assumeRole,
  listEC2Instances,
  getCPUUtilization,
  testConnection,
  listUnattachedEBSVolumes,
};