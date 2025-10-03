import { Query, Resolver, Args } from '@nestjs/graphql';
import { EmailService } from './email.service';
import { EmailMessage } from './dto/email.email-message.dto';

@Resolver()
export class EmailResolver {
  constructor(private readonly emailService: EmailService) {}

  @Query(() => [EmailMessage])
  async readEmails(): Promise<EmailMessage[]> {
    return this.emailService.readEmails();
  }

  @Query(() => [EmailMessage])
  async searchEmails(
    // TODO: Define a enum for criteria types
    @Args('searchCriteria', { type: () => [[String]] }) searchCriteria: string[][],
  ): Promise<EmailMessage[]> {
    return this.emailService.filterEmails(searchCriteria);
  }

  // @Query(() => [EmailMessage])
  // async getUnreadEmails(
  //   @Args('folder', { type: () => String, nullable: true }) folder?: string,
  // ): Promise<EmailMessage[]> {
  //   return this.emailService.getUnreadEmails(folder || 'INBOX');
  // }
}
