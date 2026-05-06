export const getShopPoliciesQuery = /* GraphQL */ `
  query getShopPolicies {
    shop {
      privacyPolicy {
        id
        title
        handle
        body
        url
      }
      refundPolicy {
        id
        title
        handle
        body
        url
      }
      termsOfService {
        id
        title
        handle
        body
        url
      }
      shippingPolicy {
        id
        title
        handle
        body
        url
      }
    }
  }
`;
