# The Data App
Project for interactively displaying statistical data of multiple levels of Australian administrative areas
<h2>Tech stack</h2>
<ul>
    <li>Amazon EC2</li>
    <li>PostgreSQL/PostGIS</li>
    <li>Slim Micro Framework</li>
    <li>Backbone.js</li>
    <li>jQuery</li>
    <li>Bootstrap 3</li>
</ul>
<h2>Description</h2>
<p>The Data App is a web application written in Backbone.js that consumes spatial data feeds from a Postgis enabled PostgreSQL DB</p>
<p>Its main purpose is to let users choose any combination of administrative areas into <i>comparison-</i> and <i>target</i> areas and then compare the statistical attributes of these groups.</p>
<p>The data is the Postgis enabled PostgreSQL DB is fetched to the main application using a REST API like interface which was created using the <a target="_blank" href="http://www.slimframework.com/">Slim Micro Framework</a></p>
<p>On the client side, the app is written using a framework called Backbone.js that uses the above mentioned API to transform incoming data into <i>models</i> and <i>collections</i> that are going to be displayed on the web map, which is the fundamental part of the application.</p>
