import { BadRequestException, Injectable } from '@nestjs/common';
import { find, forEach } from 'lodash';
import Mailgun from 'mailgun.js';
import { readFileSync } from 'fs';
import * as FormData from 'form-data';

const templates = [
  {
    name: 'newUser',
    type: 'html',
    template: 'accessEmail.html',
    subject: 'Bienvenido a Mega Shop',
    vars: [
      {
        key: 'VAR_ROLE',
        param: 'role',
      },
      {
        key: 'VAR_CLAVE',
        param: 'password',
      },
      {
        key: 'VAR_FULLNAME',
        param: 'fullname',
      },
      {
        key: 'VAR_USER',
        param: 'user',
      },
      {
        key: 'VAR_WEB',
        param: 'webUrl',
        multiple: true,
      },
    ],
  },
  {
    name: 'resetPassword',
    type: 'html',
    template: 'resetPassword.html',
    subject: 'Restablecer Cuenta de Mega Shop',
    vars: [
      {
        key: 'VAR_FULLNAME',
        param: 'fullname',
      },
      {
        key: 'VAR_EMAIL',
        param: 'email',
      },
      {
        key: 'VAR_WEB',
        param: 'route',
        multiple: true,
      },
    ],
  },
];
@Injectable()
export class EmailService {
  public mg: any;
  constructor() {
    const mailgun = new Mailgun(FormData);
    this.mg = mailgun.client({
      key: process.env.MAILGUNAPIKEY,
      username: 'api',
    });
  }

  async findAndSend(type: string, data: any) {
    const template = find(templates, (item) => item.name === type);
    if (template !== undefined && template !== null) {
      this.handleEmail(template, data);
    }
  }

  async handleEmail(data: any, params: any) {
    let html: any = readFileSync(
      `src/modules/email/template/${data.template}`,
      'utf-8',
    );
    if (data.type === 'html') {
      await forEach(data.vars, (value) => {
        const myRegExp = new RegExp(value.key, 'i');
        html = html.replace(myRegExp, params[value.param]);
        if (value.multiple) {
          html = html.replace(myRegExp, params[value.param]);
          html = html.replace(myRegExp, params[value.param]);
        }
      });
    } else {
      html = html.replace(/VAR_URL/i, data.url);
    }
    this.sendEmail(params.email, html, data.subject);
  }

  async sendEmail(to: string, html: any, subject: string) {
    return this.send({
      from: process.env.MAILGUNFROM_EMAIL,
      to: [to],
      subject,
      text: subject,
      html,
    });
  }

  async send(data: any) {
    try {
      const response = await this.mg.messages.create(
        process.env.MAILGUNDOMAIN,
        data,
      );
      return response;
    } catch (error) {
      console.log('error enviando el correo');
      return new BadRequestException('error enviando el correo');
    }
  }
}
