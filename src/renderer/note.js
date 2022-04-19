import { createBlockquote, createCode, createHeader, createHorizontalRule, createMath, createParagraph } from "./main";
import NoteBody from "./note-body";
import NoteHead from "./note-head";
import * as symbols from './symbols';

export default class Note {
  constructor(head, body) {
    this.head = head ?? new NoteHead('');
    this.body = body ?? new NoteBody();
  }

  insert(index, element) {
    this.body.children.splice(index, 0, element);
  }

  remove(index) {
    this.body.children.splice(index, 1)[0];
  }

  toXML() {
    const serializer = new XMLSerializer();
    const xml = document.implementation.createDocument(null, 'xml');
    const $root = xml.firstChild;
    const $head = xml.createElement('head');
    $root.append($head);

    for (const [key, value] of Object.entries(this.head.properties)) {
      const meta = xml.createElement(key);
      meta.append(value);
      $head.append(meta);
    }

    const $body = xml.createElement('body');
    $root.append($body);

    for (const e of this.body.children) {
      const tagName = e.type;
      const element = xml.createElement(tagName);
      element.append(e.content);
      element.setAttribute('created', e.created);
      element.setAttribute('modified', e.modified);

      if (e.language != null) {
        element.setAttribute('language', e.language);
      }

      $body.appendChild(element);
    }

    return serializer.serializeToString(xml);
  }

  static fromXML(text) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const $root = xml.firstChild;
    const $head = $root.querySelector('head');
    const properties = {};

    for (const n of $head.childNodes) {
      const tagName = n.tagName;
      const content = n.textContent;
      properties[tagName] = content;
    }

    const head = new NoteHead(properties);
    const $body = $root.querySelector('body');
    const body = [];

    for (const n of $body.childNodes) {
      const tagName = n.tagName;
      const content = n.textContent;
      const created = parseInt(n.getAttribute('created'));
      const modified = parseInt(n.getAttribute('modified'));

      if (tagName == 'p') {
        body.push(createParagraph(content, created, modified));
      } else if (tagName == 'math') {
        body.push(createMath(content, created, modified));
      } else if (symbols.headers.includes(tagName)) {
        body.push(createHeader(parseInt(tagName[1]), content, created, modified));
      } else if (tagName == 'hr') {
        body.push(createHorizontalRule(created, modified));
      } else if (tagName == 'blockquote') {
        body.push(createBlockquote(content, created, modified));
      } else if (tagName == 'code') {
        const language = n.getAttribute('language');
        body.push(createCode(content, language, created, modified));
      }
    }

    return new Note(head, new NoteBody(body));
  }
}