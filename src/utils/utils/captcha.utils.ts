import { Solver } from '@2captcha/captcha-solver';

interface CaptchaAnswer {
  /** The solution to the captcha */
  data: string;
  /** The ID of the captcha solve */
  id: string;
}

export class CaptchaService {
  private readonly solver: Solver;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('CAPTCHA_API_KEY is required');
    }

    this.solver = new Solver(apiKey);
  }

  /**
   * Cloudflare Turnstile captcha
   */
  async solveCloudflareTurnstile(params: { pageurl: string; sitekey: string }): Promise<CaptchaAnswer> {
    return this.solver.cloudflareTurnstile({
      pageurl: params.pageurl,
      sitekey: params.sitekey,
    });
  }
}
