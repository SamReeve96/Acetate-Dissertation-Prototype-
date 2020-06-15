This project has reached an end point, but the idea lives on with [Acetate 2!](https://github.com/SamReeve96/Acetate_2)

[![Build Status](https://travis-ci.org/SamReeve96/Acetate.svg?branch=master)](https://travis-ci.org/SamReeve96/Acetate)
[![GitHub version](https://badge.fury.io/gh/SamReeve96%2FAcetate.svg)](https://badge.fury.io/gh/SamReeve96%2FAcetate)
[![Known Vulnerabilities](https://snyk.io/test/github/SamReeve96/Acetate/badge.svg)](https://snyk.io/test/github/SamReeve96/Acetate)
[![HitCount](http://hits.dwyl.com/SamReeve96/Acetate.svg)](http://hits.dwyl.com/SamReeve96/Acetate)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![first-timers-only](https://img.shields.io/badge/first--timers--only-friendly-blue.svg?style=flat-square)](https://www.firsttimersonly.com/)

# Acetate

University of Portsmouth Final Year project 2019/20

A browser extension to annotate the web.

Acetate will enable users to annotate webpages with comments to provide feedback on website design.

## Developer installation guide
Installing Developer Chrome extensions can be fiddly, here's a quick step-by-step guide on the process
1. Visit the extension page by either pasting in this link "chrome://extensions" or "menu -> Tools -> Extensions".
2. Enable Developer mode by ticking the checkbox in the upper-right corner.
3. Click on the "Load unpacked extension..." button.
4. Select the directory containing your unpacked extension, for Acetate this is "(Wherever Project was downloaded to)/Acetate/extension"

## Tutorial
New to Acetate? Check out the brief tutorial [here!](https://acetate-34616.web.app/Tutorial/) (This page will also automatically load when the extension is installed)

## Contribution guide
Acetate would love your help! 
If you'd like to know more about the process of contributing to Acetate please read more here: [CONTRIBUTING.md](https://github.com/SamReeve96/Acetate/blob/master/CONTRIBUTING.md)

## Development story
### Prototype

The purpose of the prototype was to create an interactive demo that could be shown to possible end users for early feedback. The prototype has been completed, and has a branch that can be viewed at: https://github.com/SamReeve96/Acetate/tree/Prototype-One

Note the prototype's method of wrapping the page was not built to be used as an actual solution, but for speed of implementation, it will break event listeners and combat with CSS rules. So far a good example of a page that reacts well is bbc.co.uk

![Image of Prototype](https://github.com/SamReeve96/Acetate/blob/master/Misc%20Resources/Images/PrototypeOneScreenshot-20012020.png?raw=true)

### Alpha
The Alpha will take feedback from the prototype to influence the design of the extension and resolve any known bugs or issues.

Assuming it's within the guidelines, I aim to get this version onto the chrome extension store to:
- Test the user cache syncing 
- Distribute the extension for end user testing

Key goals:
- Improve the method of creating a comments container
- Resolve known bugs
- Take feedback from prototype phase to further influence design of extension

![Image of Alpha UI update](https://github.com/SamReeve96/Acetate/blob/master/Misc%20Resources/Images/AcetateUIAlphaUpdate.gif?raw=true)

Demo showing new UI and card popout triggers (hover over the card, the cards corresponding element or pressing the shortcut to open them all (currently assigned to "o")

### Beta
The Beta will build on the Alpha by implementing the backend server and Database for storage. As this is a largely technical release, it will not be released on the chrome store.

Key goals:
- Implement Server and DB meaning instances are stored online and are publicly accessible (assuming you have the link)
  - Note: the user should be informed of such as no version or view control will be implemented at this stage and never to store sensitive data here
- Once the backend is implemented, instance sharing should also be implemented.


### Alpha response
A few features were repeatedly requested in the Alpha test, those were:
- Changing the extension Icon to reflect wether the extension is active or not
- only show the extension control in the context menu if the extension is active

These are now Implemented!

This is the end of the current project scope, new release plans are to be announced soon!
