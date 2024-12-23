import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as Imap from 'node-imap';
import { simpleParser } from 'mailparser';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ImapService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}
  //   private imap: Imap;

  async onModuleInit() {
    // let emailAccounts = [
    //   {
    //     user: process.env.USER_EMAIL_1,
    //     password: process.env.USER_PASSWORD_1,
    //     host: 'imap.gmail.com',
    //     port: 993,
    //     debug: console.log,
    //     tls: true,
    //     keepalive: {
    //       interval: 60000,
    //       idleInterval: 60000,
    //       forceNoop: false,
    //     },
    //   },
    //   {
    //     user: process.env.USER_EMAIL_2,
    //     password: process.env.USER_PASSWORD_2,
    //     host: 'imap.gmail.com',
    //     port: 993,
    //     debug: console.log,
    //     tls: true,
    //     keepalive: {
    //       interval: 60000,
    //       idleInterval: 60000,
    //       forceNoop: false,
    //     },
    //   },
    // ];
    // get all emails from db
    let savedEmails = await this.userService.getAllUsers();
    console.log(savedEmails);

    savedEmails.forEach((account) => this.startMailListeners(account));
  }

  onModuleDestroy() {
    //close all connections
    // this.closeConnection();
  }

  //   private initImap() {}

  private startMailListeners(imapConfig) {
    const imap = new Imap(imapConfig);

    imap.once('ready', async () => {
      console.log(`${imapConfig.user}, IMAP connection ready...`);

      try {
        await this.openInbox(imap);
        console.log(`${imapConfig.user}, Inbox opened.`);
      } catch (err) {
        console.error('Error opening inbox:', err);
        return;
      }

      // Listen for new mail
      imap.on('mail', (numNewMsgs) => {
        console.log(
          `New mail received: ${numNewMsgs} message(s) for ${imapConfig.user}. Fetching the latest...`,
        );
        this.fetchNewEmail(imap);
      });
    });

    imap.on('error', (err) => {
      console.error('IMAP error:', err);
      // console.log("Attemping to reconnect.");
      // imap.connect();
    });

    imap.once('end', () => {
      console.log('IMAP connection ended.');
      // console.log("Attemping to reconnect.");
      // imap.connect();
    });

    imap.connect();
  }

  private fetchNewEmail(imap) {
    imap.search(['UNSEEN'], (err, results) => {
      if (err) {
        console.error('Error searching emails:', err);
        return;
      }

      if (!results || results.length === 0) {
        console.log('No new emails.');
        return;
      }

      const fetch = imap.fetch(results.slice(-1), { bodies: '' }); // Fetch only the latest unseen email

      fetch.on('message', (msg, seqno) => {
        console.log(`Processing new email #${seqno}`);

        msg.on('body', (stream) => {
          simpleParser(stream, (err, parsed) => {
            if (err) {
              console.error('Error parsing email:', err);
              return;
            }

            // console.log("all parsed:", parsed);

            console.log('--- New Email ---');
            console.log(`From: ${parsed.from.text}`);
            console.log(`Subject: ${parsed.subject}`);
            console.log(`Date: ${parsed.date}`);
            console.log(`Text: ${parsed.text}`);
            // console.log(`To: ${parsed.to.text}`);
            console.log('--- End of Email ---');
          });
        });
      });

      fetch.once('error', (err) => {
        console.error('Fetch error:', err);
      });

      fetch.once('end', () => {
        console.log('Finished processing new email.');
      });
    });
  }

  private openInbox(imap) {
    return new Promise((resolve, reject) => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) reject(err);
        else resolve(box);
      });
    });
  }

  //   private closeConnection() {
  //     if (this.imap) {
  //       this.imap.end();
  //     }
  //   }
}
