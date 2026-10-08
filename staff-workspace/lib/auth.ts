import 'server-only';
import {betterAuth} from 'better-auth';
import {genericOAuth, microsoftEntraId} from 'better-auth/plugins/generic-oauth';
import {decodeJwt} from 'jose';
import {microsoftConfig, microsoftProfile, redactedAuthDiagnostic} from './microsoft-policy.mjs';

export function createMicrosoftAuth(config:NonNullable<ReturnType<typeof microsoftConfig>>) {
  return betterAuth({
    appName:'JDPI Staff Workspace', baseURL:config.origin, basePath:'/api/auth',
    secret:config.secret, trustedOrigins:[config.origin],
    // Never log provider messages/objects: they can contain codes or tokens.
    logger:{level:'error', log:(_level,_message,...values) => console.error('JDPI Microsoft diagnostic:',redactedAuthDiagnostic(values))}, telemetry:{enabled:false},
    emailAndPassword:{enabled:false},
    // This phase proves identity ONLY; no database membership or role is granted.
    session:{expiresIn:900, disableSessionRefresh:true, cookieCache:{enabled:true, strategy:'jwe', maxAge:900, refreshCache:false}},
    account:{accountLinking:{enabled:false}, storeStateStrategy:'cookie', skipStateCookieCheck:false, storeAccountCookie:false, encryptOAuthTokens:true},
    advanced:{cookiePrefix:'jdpi-workspace', useSecureCookies:config.origin.startsWith('https:'), defaultCookieAttributes:{httpOnly:true, sameSite:'lax', path:'/'}},
    // Better Auth's provider-profile parser needs input:true to retain mapped
    // fields. They come ONLY from the verified server-side mapper below: the
    // route wrapper blocks signup/update/link APIs and extra sign-in body keys.
    user:{additionalFields:{tenantId:{type:'string', required:true, input:true}, objectId:{type:'string', required:true, input:true}}},
    onAPIError:{errorURL:`${config.origin}/auth/error`},
    plugins:[genericOAuth({config:[{
      ...microsoftEntraId({clientId:config.clientId, clientSecret:config.clientSecret, tenantId:config.tenantId, scopes:['openid','profile','email'], pkce:true, disableProviderLogout:true}),
      providerId:'microsoft', prompt:'select_account', requireIdTokenVerification:true,
      // genericOAuth verifies ID-token signature and nonce before calling this.
      // No Graph calls, mailbox access, refresh tokens, or profile-image download.
      getUserInfo:async tokens => {
        if (!tokens.idToken) return null;
        try {return microsoftProfile(decodeJwt(tokens.idToken), config.tenantId);} catch {return null;}
      },
      accountSubject:({profile}) => `${config.tenantId}:${profile.oid}`,
      mapProfileToUser:profile => ({tenantId:profile.tenantId as string, objectId:profile.objectId as string}),
    }]})],
  });
}

let instance:ReturnType<typeof createMicrosoftAuth> | undefined;
export function getAuth() {
  const config = microsoftConfig(process.env);
  if (!config) return null;
  return instance ??= createMicrosoftAuth(config);
}
