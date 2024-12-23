import { Module } from '@nestjs/common';
import { ImapService } from './imap.service';
import { UserModule } from 'src/user/user.module';

@Module({
  providers: [ImapService],
  imports: [UserModule],
})
export class ImapModule {}
