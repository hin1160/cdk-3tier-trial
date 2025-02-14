import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'; 
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { WebServerInstance } from './constructs/web-server-instance'; // 自作コンストラクトを import
import { Key } from 'aws-cdk-lib/aws-kms';

//ここからリソースを作成
export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const systemName: string = 'workshop-';
    const envType: string = 'prd-';
    
    //VPC
    const vpc = new ec2.CfnVPC(this, "BlogVpc", {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: [{key: "name", value: systemName + envType + "vpc" }]
    });

    //サブネット
    //WebServer1
    const privateSubnetForWebServer1 = new ec2.PrivateSubnet(this, "privateSubnetForWebServer1", {
      availabilityZone: 'ap-northeast-1a',
      cidrBlock: '10.0.0.0/24',
      vpcId: vpc.ref
    });
    
    //WebServer2
    const privateSubnetForWebServer2 = new ec2.PrivateSubnet(this, "privateSubnetForWebServer2", {
      availabilityZone: 'ap-northeast-1c',
      cidrBlock: '10.0.1.0/24',
      vpcId: vpc.ref
    });
    


    //新しく作成したコンストラクタを使用してインスタンスを宣言
    //1台目
    const webServer1 = new WebServerInstance(this, "WebServer1", {
      //★TODO:タグのValue部分、セキュリティグループ、サブネットを渡したい
      vpc
    });
    
    //2台目
    const webServer2 = new WebServerInstance(this, "WebServer2", {
      vpc
    });    


    //rdsを宣言
    const rdsServer1 = new rds.DatabaseInstance(this, "primaryRdsServer1", {
      engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0_36}),
      vpc,
      databaseName: "wordpress",
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      multiAz: true
    });

    //アクセス許可対象をコンストラクト内のインスタンスに変更
    //1台目のWebServerへのアクセス許可
    rdsServer1.connections.allowDefaultPortFrom(webServer1.instance);
    //2台目のWebServerへのアクセス許可
    rdsServer1.connections.allowDefaultPortFrom(webServer2.instance);
    
    //ALBを宣言
    const alb = new elbv2.ApplicationLoadBalancer(this, "wordPressALB", {
      vpc,
      internetFacing: true
    });

    //リスナーを追加
    const albListner = alb.addListener("wordPressALBListner", {port: 80});

    //ターゲットとなるインスタンスを宣言
    const instanceTarget = new targets.InstanceTarget(webServer1.instance, 80); 
    
    //ターゲットをリスナーに追加
    //addListnerメソッドがApplicationListnerを返すので、ApplicationListnerクラスのメソッドが使えるようになる
    albListner.addTargets("ALBListnerTargets", {
      port: 80,
      targets: [instanceTarget],
      healthCheck: {path : "/wp-includes/images/blank.gif"}, //HealthCheck型のオブジェクト
    })  

    //ALBからEC2へのアクセスを許可
    webServer1.instance.connections.allowFrom(alb,ec2.Port.tcp(80));

  }
}

