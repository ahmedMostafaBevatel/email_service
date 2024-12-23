import { Module } from '@nestjs/common';
import { ImapService } from './imap.service';

@Module({
  providers: [ImapService]
})
export class ImapModule {}
