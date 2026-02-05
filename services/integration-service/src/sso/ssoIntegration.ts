import axios, { AxiosInstance } from "axios";
import jwt from "jsonwebtoken";

export interface SSOProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  discoveryUrl?: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  revokeUrl?: string;
}

export interface SSOUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role?: string;
}

export class SSOIntegration {
  private api: AxiosInstance;
  private provider: SSOProvider;

  constructor(provider: SSOProvider) {
    this.provider = provider;
    this.api = axios.create();
  }

  async getAuthorizationUrl(
    redirectUri: string,
    state: string,
  ): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.provider.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid profile email",
      state,
    });

    return `${this.provider.authorizationUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
    try {
      const response = await this.api.post(this.provider.tokenUrl, {
        grant_type: "authorization_code",
        code,
        client_id: this.provider.clientId,
        client_secret: this.provider.clientSecret,
        redirect_uri: redirectUri,
      });

      return response.data;
    } catch (error) {
      console.error("Failed to exchange code for token:", error);
      throw error;
    }
  }

  async getUserInfo(accessToken: string): Promise<SSOUser> {
    try {
      const response = await this.api.get(this.provider.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        id: response.data.sub || response.data.id,
        email: response.data.email,
        name: response.data.name,
        picture: response.data.picture,
      };
    } catch (error) {
      console.error("Failed to get user info:", error);
      throw error;
    }
  }

  async revokeToken(token: string): Promise<void> {
    if (!this.provider.revokeUrl) {
      console.warn("Revoke URL not available for provider");
      return;
    }

    try {
      await this.api.post(this.provider.revokeUrl, {
        token,
        client_id: this.provider.clientId,
        client_secret: this.provider.clientSecret,
      });
    } catch (error) {
      console.error("Failed to revoke token:", error);
      throw error;
    }
  }

  verifyIdToken(idToken: string): any {
    try {
      // In production, verify signature against JWKS endpoint
      const decoded = jwt.decode(idToken, { complete: true });
      return decoded?.payload;
    } catch (error) {
      console.error("Failed to verify ID token:", error);
      throw error;
    }
  }
}

// Google OAuth2
export class GoogleSSOIntegration extends SSOIntegration {
  constructor(clientId: string, clientSecret: string) {
    super({
      name: "google",
      clientId,
      clientSecret,
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
      revokeUrl: "https://oauth2.googleapis.com/revoke",
    });
  }
}

// Microsoft/Azure AD
export class AzureADSSOIntegration extends SSOIntegration {
  constructor(clientId: string, clientSecret: string, tenantId: string) {
    super({
      name: "azure-ad",
      clientId,
      clientSecret,
      authorizationUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
      tokenUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      userInfoUrl: "https://graph.microsoft.com/v1.0/me",
      revokeUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout`,
    });
  }
}

// Okta
export class OktaSSOIntegration extends SSOIntegration {
  constructor(clientId: string, clientSecret: string, domain: string) {
    super({
      name: "okta",
      clientId,
      clientSecret,
      authorizationUrl: `https://${domain}/oauth2/v1/authorize`,
      tokenUrl: `https://${domain}/oauth2/v1/token`,
      userInfoUrl: `https://${domain}/oauth2/v1/userinfo`,
      revokeUrl: `https://${domain}/oauth2/v1/revoke`,
    });
  }
}

// Okta with SAML2
export class OktaSAMLIntegration {
  private idpUrl: string;
  private spEntityId: string;
  private acsUrl: string;
  private privateKey: string;

  constructor(
    idpUrl: string,
    spEntityId: string,
    acsUrl: string,
    privateKey: string,
  ) {
    this.idpUrl = idpUrl;
    this.spEntityId = spEntityId;
    this.acsUrl = acsUrl;
    this.privateKey = privateKey;
  }

  generateSAMLRequest(): string {
    // Generate SAML AuthnRequest
    const samlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="id-${Math.random().toString(36).substring(7)}"
  Version="2.0"
  IssueInstant="${new Date().toISOString()}"
  Destination="${this.idpUrl}"
  AssertionConsumerServiceURL="${this.acsUrl}">
  <saml:Issuer>${this.spEntityId}</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified" AllowCreate="true"/>
</samlp:AuthnRequest>`;

    return Buffer.from(samlRequest).toString("base64");
  }

  processSAMLResponse(samlResponse: string): SSOUser {
    // Parse and validate SAML Response
    // This is simplified - in production use a SAML library
    try {
      const decoded = Buffer.from(samlResponse, "base64").toString("utf-8");
      // Extract user information from SAML assertion
      const userMatch = decoded.match(
        /urn:oid:0\.9\.2342\.19200300\.100\.1\.3[^<]*>([^<]+)</,
      );
      const emailMatch = decoded.match(
        /urn:oid:0\.9\.2342\.19200300\.100\.1\.25[^<]*>([^<]+)</,
      );

      return {
        id: userMatch?.[1] || "",
        email: emailMatch?.[1] || "",
        name: userMatch?.[1] || "",
      };
    } catch (error) {
      console.error("Failed to process SAML response:", error);
      throw error;
    }
  }
}

// LDAP/Active Directory
export class LDAPIntegration {
  private api: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL,
    });
  }

  async authenticateUser(username: string, password: string): Promise<SSOUser> {
    try {
      const response = await this.api.post("/authenticate", {
        username,
        password,
      });

      return {
        id: response.data.uid,
        email: response.data.mail,
        name: response.data.cn,
      };
    } catch (error) {
      console.error("LDAP authentication failed:", error);
      throw error;
    }
  }

  async searchUser(query: string): Promise<SSOUser[]> {
    try {
      const response = await this.api.get("/search", {
        params: { q: query },
      });

      return response.data.results.map((user: any) => ({
        id: user.uid,
        email: user.mail,
        name: user.cn,
      }));
    } catch (error) {
      console.error("Failed to search users:", error);
      throw error;
    }
  }

  async syncUsers(): Promise<SSOUser[]> {
    try {
      const response = await this.api.get("/users");
      return response.data.users.map((user: any) => ({
        id: user.uid,
        email: user.mail,
        name: user.cn,
      }));
    } catch (error) {
      console.error("Failed to sync users:", error);
      throw error;
    }
  }
}

export default {
  GoogleSSO: GoogleSSOIntegration,
  AzureADSSO: AzureADSSOIntegration,
  OktaSSO: OktaSSOIntegration,
  OktaSAML: OktaSAMLIntegration,
  LDAP: LDAPIntegration,
};
