const parse5 = require('parse5')
const striptags = require('striptags')
const slug = require('slug')

const parserFactory = () => {
  return {

    // Returns the number of fragments successfully parsed
    parse: (post, index) => {
      let fragment = {}
      let headingCount = 0

      const cleanhtml = striptags(post.html, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
      const nodes = parse5.parseFragment(cleanhtml).childNodes

      if(nodes.length !== 0) { //can that be true even with an empty doc?
        // Set first hypothetical headless fragment attributes.
        if(!isHeading(nodes[0])) {
          fragment.id = post.slug;
          // we give a higher importance to the intro (the first headless fragment)
          fragment.importance = 0;
          fragment.post_uuid = post.uuid;
          fragment.post_title = post.title;
          fragment.post_published_at = post.published_at;
        }

        nodes.forEach(function(node) {
          if(isHeading(node)) {
            // Send previous fragment
            index.addFragment(fragment);

            fragment = {};
            headingCount ++;
            fragment.heading = node.childNodes[0].value;
            fragment.id = post.slug + '#' + slug(fragment.heading, {lower: true}) + '--' + headingCount;
            fragment.importance = getHeadingLevel(node.nodeName);
            fragment.post_uuid = post.uuid;
            fragment.post_title = post.title;
            fragment.post_published_at = post.published_at;
            fragment.plaintext = post.plaintext;
            fragment.html = post.html;
            fragment.updated_at = post.updated_at;
            fragment.url = post.url;
            fragment.tags = post.tags;
            fragment.slug = post.slug;
          } else {
            if(fragment.content === undefined) fragment.content = '';
            // If node not a heading, then it is a text node and always has a value property
            fragment.content += node.value + ' ';
          }
        })

        // Saving the last fragment (as saving only happens as a new heading
        // is found). This also takes care of heading-less articles.
        index.addFragment(fragment);
      }

      return index.fragmentsCount();
    }
  }
}

const isHeading = (node) => {
  // The cleaned up html only contains headings and text nodes (#text).
  // All nodes whose name start with 'h' are necessarily headings.
  return node.nodeName.startsWith('h')
}

const getHeadingLevel = (nodeName) => {
  return nodeName.charAt(1)
}

module.exports = parserFactory;
