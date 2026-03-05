---
layout: page
title: Resources
permalink: /resources/
---

{% assign items = site.resources | sort: "date" | reverse %}
<ul>
  {% for doc in items %}
    <li>
      {% if doc.date %}{{ doc.date | date: "%Y-%m-%d" }} — {% endif %}
      <a href="{{ doc.url | relative_url }}">{{ doc.title | default: doc.name }}</a>
    </li>
  {% endfor %}
</ul>