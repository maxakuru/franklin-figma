export const enum ContentType {
  URLForm = 'application/x-www-form-urlencoded',
  JSON = 'application/json'
}

export const enum GrantType {
  AuthCode = 'authorization_code',
  RefreshToken = 'refresh_token'
}

export const enum SessionState {
  Pending = 'pending',
  Active = 'active'
}