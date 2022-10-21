export { generate as generatePKCE } from './pkce';
export { parseQueryResponse, parseURLResponse } from './response';

import { type OpenIDConfiguration } from './OpenIDConfiguration';
import { AuthorizeResponse } from './response';
export { OpenIDConfigurationManager, type OpenIDConfiguration } from './OpenIDConfiguration';

export function buildLogoutURL(
  configuration: OpenIDConfiguration,
  options: {
    id_token_hint?: string,
    logout_hint?: string,
    post_logout_redirect_uri?: string,
    state?: string,
    ui_locales?: string
  }
) : URL {
  const url = new URL(configuration.end_session_endpoint);

  for (const [k, v] of Object.entries(options)) {
    url.searchParams.set(k, v);
  }
  return url;
}

export type AuthorizeURLOptions = {
  redirect_uri: string;
  response_type: string;
  response_mode: string;
  acr_values?: string | string[];
  code_challenge_method?: string,
  code_challenge?: string
  state?: string;
  login_hint?: string;
  ui_locales?: string;
  scope: string;
  prompt?: string;
  nonce?: string
}

export function buildAuthorizeURL(
  configuration: OpenIDConfiguration,
  options: AuthorizeURLOptions
) {
  const url = new URL(configuration.authorization_endpoint);

  for (const [k, v] of Object.entries(options)) {
    if (k === 'acr_values') continue;
    url.searchParams.set(k, v as string);
  }

  if (options.acr_values) {
    url.searchParams.set('acr_values', Array.isArray(options.acr_values) ? options.acr_values.join(' ') : options.acr_values);
  }

  return url;
}


export function parseAuthorizeOptionsFromUrl(input: string | URL) : Partial<AuthorizeURLOptions> & {domain: string, client_id: string} {
  const url = typeof input === "string" ? new URL(input) : input;

  return {
    domain: url.host,
    client_id: url.searchParams.get('client_id')!,
    acr_values: url.searchParams.get('acr_values')?.split(' ') ?? undefined,
    redirect_uri: url.searchParams.get('redirect_uri') ?? undefined,
    response_type: url.searchParams.get('response_type') ?? undefined,
    response_mode: url.searchParams.get('response_mode') ?? undefined,
    code_challenge: url.searchParams.get('code_challenge') ?? undefined,
    code_challenge_method: url.searchParams.get('code_challenge_method') ?? undefined,
    state: url.searchParams.get('state') ?? undefined,
    login_hint: url.searchParams.get('login_hint') ?? undefined,
    ui_locales: url.searchParams.get('ui_locales') ?? undefined,
    scope: url.searchParams.get('scope') ?? undefined,
    nonce: url.searchParams.get('nonce') ?? undefined,
    prompt: url.searchParams.get('prompt') ?? undefined
  };
}

export async function codeExchange(
  configuration: OpenIDConfiguration,
  options: {
    code: string,
    redirect_uri: string
    code_verifier: string
  }
) : Promise<AuthorizeResponse> {
  const body = new URLSearchParams();
  body.append('grant_type', "authorization_code");
  body.append('code', options.code);
  body.append('client_id', configuration.client_id);
  body.append('redirect_uri', options.redirect_uri);
  body.append('code_verifier', options.code_verifier);

  const response = await fetch(configuration.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    credentials: 'omit',
    body: body.toString()
  });

  const payload = await response.json();

  return {id_token: payload.id_token};
}