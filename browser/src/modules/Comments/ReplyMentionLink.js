import { Module } from '../../class/Module';
import { shared } from '../../class/Shared';

class CommentsReplyMentionLink extends Module {
  constructor() {
    super();
    this.info = {
      description: [
        [`ul`, [
          [`li`, `Adds a link (@user) next to a reply's "Permalink" (in any page) that mentions the user being replied to and links to their comment.`],
          [`li`, `This feature is useful for conversations that have very deep nesting levels, which makes it impossible to know who replied to whom.`]
        ]]
      ],
      id: `rml`,
      name: `Reply Mention Link`,
      sg: true,
      st: true,
      type: `comments`,
      featureMap: {
        endless: this.rml_addLinks.bind(this)
      }
    };
  }

  rml_addLinks(context, main, source, endless) {
    const elements = context.querySelectorAll(`${endless ? `.esgst-es-page-${endless} .comment__children, .esgst-es-page-${endless}.comment__children` : `.comment__children`}, ${endless ? `.esgst-es-page-${endless} .comment_children, .esgst-es-page-${endless}.comment_children` : `.comment_children`}`);
    for (let i = 0, n = elements.length; i < n; ++i) {
      const children = elements[i].children;
      if (children.length) {
        this.rml_addLink(shared.esgst.sg ? elements[i].parentElement.getElementsByClassName(`comment__summary`)[0] : elements[i].parentElement, children);
      }
    }
  }

  rml_addLink(Context, Matches) {
    let Username, ID, I, N, RMLLink;
    Username = Context.getElementsByClassName(shared.esgst.sg ? `comment__username` : `author_name`)[0].textContent.trim();
    ID = Context.id;
    for (I = 0, N = Matches.length; I < N; ++I) {
      Context = Matches[I].getElementsByClassName(shared.esgst.sg ? `comment__actions` : `action_list`)[0];
      RMLLink = Context.getElementsByClassName(`esgst-rml-link`)[0];
      if (RMLLink) {
        RMLLink.textContent = `@${Username}`;
      } else {
        shared.common.createElements(Context, `beforeEnd`, [{
          attributes: {
            class: `comment__actions__button esgst-rml-link`,
            href: `#${ID}`
          },
          text: `@${Username}`,
          type: `a`
        }]);
      }
    }
  }
}

const commentsReplyMentionLink = new CommentsReplyMentionLink();

export { commentsReplyMentionLink };