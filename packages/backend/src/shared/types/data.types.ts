export interface DataListingDto {
  category: string;
  format: string;
  sizeBytes: number;
  description: string;
  minPrice: number;
  datasetHash: string;
  privacyProof?: string;
}

export interface DataBidDto {
  listingId: string;
  maxPrice: number;
  accessDuration: number;
  purpose: string;
}

export interface DataAccessToken {
  tokenId: string;
  listingId: string;
  buyerAddress: string;
  accessEndpoint: string;
  expiresAt: string;
}
