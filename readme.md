# Durham Restaurants Map

This site is built using jekyll + browserify + bower, held together with grunt. 
Based on a workflow from [here](http://www.aymerick.com/2014/07/22/jekyll-github-pages-bower-bootstrap.html), but without using CoffeeScript.

## Initial set-up:

1. Install npm.
2. Install grunt's command-line interface `npm install grunt-cli -g`
3. Run `npm install` from the command line inside the root directory to install local copies of necessary packages (this also calls bower install to install bower packages).

## To run the site locally:

1. `grunt serve`
2. Go to localhost:4000 in your browser.

## To push to gh-pages:

1. Run `grunt deploy`. Currently this pushes to the gh-pages branch on timstallmann's fork of the repo 
because the savaslabs repo github pages isn't set up right, yet.

## Notes

* The javascript you should be editing is in js/map_source.js, which will get compiled to js/map_bundle.js by the grunt task.
