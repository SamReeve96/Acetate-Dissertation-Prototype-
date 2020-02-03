# Acetate

University of Portsmouth Final Year project 2019/20

A browser extension to annotate the web.

Acetate will enable users to annotate webpages with comments to provide feedback on website design.

## Release roadmap
### Prototype

The purpose of the prototype was to create an interactive demo that could be shown to possbile end users for early feedback. The prototype has been completed, and has a branch that can be viewed at: https://github.com/SamReeve96/Acetate/tree/Prototype-One

Note the prototype's method of wrapping the page was not built to be used as an actual solution, but for speed of implementation, it will break event listeners and combat with CSS rules. So far a good example of a page that reacts well is bbc.co.uk

![Image of Prototype](https://github.com/SamReeve96/Acetate/blob/master/Misc%20Resources/PrototypeOneScreenshot-20012020.png?raw=true)

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
- Implement Server and DB meaning instances are stored online and are publically accessible (assuming you have the link)
  - Note: the user should be informed of such as no version or view control will be implemented at this stage and never to store sensitive data here
- Once the backend is implemented, instance sharing should also be implemented.


### Version 1.0
Notes from the beta should be used to influence the final build of the program. As well as any compliance issues that need resolving e.g. gdpr 
