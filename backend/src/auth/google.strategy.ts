import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    let callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    // Fallback: If we're in production and callbackURL is set to localhost (from default .env),
    // or if callbackURL is not set, use a relative path to resolve dynamically.
    if (process.env.NODE_ENV === 'production' && callbackURL && callbackURL.includes('localhost')) {
      console.warn(
        `[GoogleStrategy] GOOGLE_CALLBACK_URL is set to a localhost URL in production: "${callbackURL}". ` +
        `Falling back to dynamic relative path '/auth/google/callback' to resolve against the incoming request host.`
      );
      callbackURL = '/auth/google/callback';
    } else if (!callbackURL) {
      callbackURL = '/auth/google/callback';
    }

    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') as string,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') as string,
      callbackURL,
      scope: ['email', 'profile'],
      state: false, // Disabled state to avoid requiring express-session
      proxy: true,  // Crucial for resolving relative URLs to HTTPS behind reverse proxies
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName } = profile;
    const user = await this.authService.validateGoogleUser({
      email: emails[0].value,
      name: displayName,
      googleId: id,
    });
    done(null, user);
  }
}
