# JsScraper - About
**JsScraper** is an online bookmarklet tool to scrap data from pdfs converted to webpages.

Inspiration came from [KimonoLabs](https://www.kimonolabs.com/) and retyping by hand tons of pdfs (hooray to *public-but-not-open-data*).

# How to
1. Convert your pdf using `pdftohtml -c doc.pdf out/doc.html`. You can find PdfToHtml [here](http://pdftohtml.sourceforge.net/).
2. Insert script and styles references (soon to be swapped by bookmarklet)

        <script src="http://code.jquery.com/jquery-1.11.1.min.js"></script>
        <script src="http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/sha1.js"></script>
        <script src="../keys.js"></script>
        <script src="../analyze.js"></script>
        <link rel="stylesheet" href="../js-scraper.css"/>

3. Open the first page you want to parse in your browser!

# Usage

*In process..*

# Architecture

MVC approach to keep things simple. To extract data with given rules UI is not needed.

1. **Database** - keeps all the data, get feeded by Processor
2. **Processor** - keeps the rules, process stream of pages, feeds database with data
3. **UI** - panel to help user create the rules and visualize the data processed
4. **Bookmarklet Bootstrap** - just click to enable the app on any webpage, inspired by [VisualEvent](http://sprymedia.co.uk/article/Visual+Event+2)

# Technology behind

While draft of this app was written in pure JS, it would kill the project continuing this approach. So welcome [CoffeeScript](http://coffeescript.org/).

UI is planned to be written in [EmberJS](http://emberjs.com/).

# Bugs / feature request

Please post [an issue]() with one of the labels:

1. **Bug**
2. **Feature request**

# Want to help?

I'll be happy to accept any pull-requests. See the roadmap below to see how I see where the project should go.

## Roadmap

1. Create bookmarklet to ease the usage
2. Expand to processing normal webpages
3. API stub generation [Create swagger API spec from data (which then enables creating clients, server stubs, etc.)]