resource "aws_iam_policy" "aws_load_balancer_controller" {
    policy = jsonencode({
        Version = "2012-10-17",
        Statement = [
            {
                Sid    = "AllowSLRForELB",
                Effect = "Allow",
                Action = ["iam:CreateServiceLinkedRole"],
                Resource = "*",
                Condition = {
                    StringEquals = {
                        "iam:AWSServiceName" = "elasticloadbalancing.amazonaws.com"
                    }
                }
            },
            {
                Sid    = "DescribeAndGetResources",
                Effect = "Allow",
                Action = [
                    "ec2:Describe*",
                    "ec2:GetCoipPoolUsage",
                    "ec2:GetIpamPoolCidrs",
                    "ec2:DescribeCoipPools",
                    "ec2:GetSecurityGroupsForVpc",
                    "ec2:AuthorizeSecurityGroupIngress",
                    "ec2:RevokeSecurityGroupIngress",
                    "ec2:CreateSecurityGroup",
                    "elasticloadbalancing:Describe*",
                    "cognito-idp:DescribeUserPoolClient",
                    "acm:ListCertificates",
                    "acm:DescribeCertificate",
                    "iam:ListServerCertificates",
                    "iam:GetServerCertificate",
                    "waf-regional:GetWebACL",
                    "waf-regional:GetWebACLForResource",
                    "waf-regional:AssociateWebACL",
                    "waf-regional:DisassociateWebACL",
                    "wafv2:GetWebACL",
                    "wafv2:GetWebACLForResource",
                    "wafv2:AssociateWebACL",
                    "wafv2:DisassociateWebACL",
                    "shield:DescribeProtection",
                    "shield:GetSubscriptionState",
                    "shield:DescribeSubscription",
                    "shield:CreateProtection",
                    "shield:DeleteProtection"
                ],
                Resource = "*"
            },
            {
                Sid    = "TagNewSecurityGroupsWithClusterTag",
                Effect = "Allow",
                Action = ["ec2:CreateTags"],
                Resource = "arn:aws:ec2:*:*:security-group/*",
                Condition = {
                    StringEquals = {
                        "ec2:CreateAction" = "CreateSecurityGroup"
                    },
                    Null = {
                        "aws:RequestTag/elbv2.k8s.aws/cluster" = "false"
                    }
                }
            },
            {
                Sid    = "ManageTagsOnTaggedSecurityGroups",
                Effect = "Allow",
                Action = [
                    "ec2:CreateTags",
                    "ec2:DeleteTags"
                ],
                Resource = "arn:aws:ec2:*:*:security-group/*",
                Condition = {
                    Null = {
                        "aws:RequestTag/elbv2.k8s.aws/cluster"  = "true",
                        "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
                    }
                }
            },
            {
                Sid    = "ManageIngressOnTaggedSecurityGroups",
                Effect = "Allow",
                Action = [
                    "ec2:AuthorizeSecurityGroupIngress",
                    "ec2:RevokeSecurityGroupIngress",
                    "ec2:DeleteSecurityGroup"
                ],
                Resource = "*",
                Condition = {
                    Null = {
                        "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
                    }
                }
            },
            {
                Sid    = "CreateTaggedELBResources",
                Effect = "Allow",
                Action = [
                    "elasticloadbalancing:CreateLoadBalancer",
                    "elasticloadbalancing:CreateTargetGroup"
                ],
                Resource = "*",
                Condition = {
                    Null = {
                        "aws:RequestTag/elbv2.k8s.aws/cluster" = "false"
                    }
                }
            },
            {
                Sid    = "ManageTagsOnELBResources",
                Effect = "Allow",
                Action = [
                    "elasticloadbalancing:AddTags",
                    "elasticloadbalancing:RemoveTags"
                ],
                Resource = [
                    "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*",
                    "arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*",
                    "arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"
                ],
                Condition = {
                    Null = {
                        "aws:RequestTag/elbv2.k8s.aws/cluster"  = "true",
                        "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
                    }
                }
            },
            {
                Sid    = "ManageTagsOnELBListenersAndRules",
                Effect = "Allow",
                Action = [
                    "elasticloadbalancing:AddTags",
                    "elasticloadbalancing:RemoveTags"
                ],
                Resource = [
                    "arn:aws:elasticloadbalancing:*:*:listener/net/*/*/*",
                    "arn:aws:elasticloadbalancing:*:*:listener/app/*/*/*",
                    "arn:aws:elasticloadbalancing:*:*:listener-rule/net/*/*/*",
                    "arn:aws:elasticloadbalancing:*:*:listener-rule/app/*/*/*"
                ]
            },
            {
                Sid    = "ModifyOrDeleteTaggedELBResources",
                Effect = "Allow",
                Action = [
                    "elasticloadbalancing:ModifyLoadBalancerAttributes",
                    "elasticloadbalancing:SetIpAddressType",
                    "elasticloadbalancing:SetSecurityGroups",
                    "elasticloadbalancing:SetSubnets",
                    "elasticloadbalancing:DeleteLoadBalancer",
                    "elasticloadbalancing:ModifyTargetGroup",
                    "elasticloadbalancing:ModifyTargetGroupAttributes",
                    "elasticloadbalancing:DeleteTargetGroup"
                ],
                Resource = "*",
                Condition = {
                    Null = {
                        "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
                    }
                }
            },
            {
                Sid    = "RegisterAndDeregisterTargets",
                Effect = "Allow",
                Action = [
                    "elasticloadbalancing:RegisterTargets",
                    "elasticloadbalancing:DeregisterTargets"
                ],
                Resource = "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*"
            },
            {
                Sid    = "ConfigureELBListenerRules",
                Effect = "Allow",
                Action = [
                    "elasticloadbalancing:SetWebAcl",
                    "elasticloadbalancing:ModifyListener",
                    "elasticloadbalancing:AddListenerCertificates",
                    "elasticloadbalancing:RemoveListenerCertificates",
                    "elasticloadbalancing:ModifyRule"
                ],
                Resource = "*"
            }
        ]
    })
    tags = {
        Name = "AWSLoadBalancerControllerIAMPolicy"
    }
}
