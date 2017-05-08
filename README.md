# WDC
Main assignment for web and database computing

To run the server do the following (this is copied from Practical Exercise 4)

Guide
1. Download and Install NodeJS.
    You can find the installer HERE (Links to an external site.)Links to an external site..
    Linux users should use install the appropriate package using their package management system.
2. Create the folder that you want your express server files to reside in.
3. Open a command prompt/terminal and navigate to the folder that you just created.
4. Run the command "npm install -g express-generator".
    Mac users may need to run sudo npm install -g express-generator.
    Linux users should use install the express-generator package using their package management system if available, otherwise run the   sudo version of the command as above.
5. Run the command "express".
    This should populate the current folder with files for your express server.
6. Run the command "npm install".
    This will download all of the required moduled for the express server and populate the node_modules folder.
    This may not work on some lab computers. If not, you can download this zip fileView in a new window and extract its contents into the folder with your express files.
7. Run the command "npm start".
    This will start the express server if everything has installed properly.
8. You can now access your express server by navigating a web browser to http://localhost:3000/
    Any files that you place in the public folder will now be served by the express server.
    For example, if you have a file hello.html in the public folder, you can access it at http://localhost:3000/hello.html
    Another example, if you move hello.html to a folder named files inside the public folder, you can access it at http://localhost:3000/files/hello.html
