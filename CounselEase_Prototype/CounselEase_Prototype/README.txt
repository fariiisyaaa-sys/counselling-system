COUNSELEASE - HTML/CSS/JavaScript storyboard prototype

HOW TO RUN
1. Extract the ZIP file to a folder.
2. Open the folder in Visual Studio Code.
3. Open index.html.
4. Recommended: install the VS Code extension "Live Server".
5. Right-click index.html and choose "Open with Live Server".
6. Log in with the demo account below.

DEMO COUNSELLOR LOGIN
Email: admin@counsel.ease
Password: Admin123!

DEMO CLIENT LOGINS
- Aina Rahman: aina@example.com / Client123!
- Daniel Lee: daniel@example.com / Client123!

ROLE-BASED PROTOTYPE ACCOUNTS
- An email ending in @counsel.ease (case-insensitive) registers as a counsellor.
- Any other valid email address registers as a client.
- Clients have a private dashboard, profile and appointment history.
- Clients can view read-only session records for their own completed appointments.
- Counsellors use the existing management dashboard and assigned records.
- Counsellors can create and update session records for their own completed appointments.
- Client registration accepts an optional phone number and age.
- Client accounts can request appointments with counsellors in the prototype.
- Both roles can open Feedback after a completed appointment.

PAGES
index.html          Login
register.html       Registration
dashboard.html      Counsellor dashboard overview
client-dashboard.html Client dashboard
clients.html        Client CRUD
appointments.html   Counsellor appointment management
my-appointments.html Client appointment booking and history
my-records.html      Client read-only session records
profile.html        The logged-in user's profile
records.html        Counsellor session record workspace
feedback.html            Client feedback interface
counsellor-feedback.html Counsellor feedback workspace
styles.css          Shared styling
app.js              Prototype interactions and localStorage data

BACKGROUND ASSETS
- assets/auth-pink-circles.jpg is used behind the login and registration forms.
- assets/dashboard-pink-silk.jpg is used behind client and counsellor pages.
- Pinterest references: https://pin.it/1mByQpEUh and https://pin.it/4sfEc9584

IMPORTANT PROJECT NOTE
This is a front-end storyboard/prototype. It uses browser localStorage and sessionStorage
to demonstrate the screens and interactions, including role and ownership checks in
JavaScript. Browser storage is user-editable and is NOT secure authentication or
server-enforced authorization. It does NOT implement secure authentication,
Java sessions, JavaBeans, Servlets, JSP, or a database.

Your lecturer's system specification separately requires Java MVC:
- Model: JavaBeans and database access classes
- View: JSP pages
- Controller: Java Servlets
- Login/logout: HttpSession
- Database: e.g. MySQL or the database specified by your lecturer

Use this prototype to agree on the screens and workflow first. The next development
stage is to connect the same screens to Java Servlets, JSP, JavaBeans and a real database.

DEMO DATA
The prototype starts with two sample clients, two scheduled appointments and one completed appointment for feedback and session-record testing. Counsellors can change an appointment's status in the schedule; only appointments marked Completed can receive feedback or session records.
Data is stored only in the browser where you run it. Use the "Reset site data"
option in your browser developer tools / site settings to clear the demo.

Feedback is stored in the `feedbacks` collection inside the CounselEase
localStorage data. A participant can submit one entry per completed appointment;
each entry references the appointment and distinct giver/recipient user IDs.
