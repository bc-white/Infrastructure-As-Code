resource "aws_vpc_peering_connection" "eks_to_directory_service" {
    peer_owner_id = "462835983058"
    peer_vpc_id   = "vpc-0820129dba625f39b"
    vpc_id        = module.vpc.vpc_id
    peer_region   = "us-east-1"
    auto_accept   = false
    tags = {
        Name        = "EKS-to-DirectoryService-Peering"
        Purpose     = "LDAP-Access"
    }
}

resource "aws_route" "eks_to_directory_service" {
    count                     = length(module.vpc.private_route_table_ids)
    route_table_id            = module.vpc.private_route_table_ids[count.index]
    destination_cidr_block    = "10.0.0.0/16"
    vpc_peering_connection_id = aws_vpc_peering_connection.eks_to_directory_service.id
}
