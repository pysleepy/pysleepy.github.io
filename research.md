---
layout: page
title: Research
permalink: /research/
---

<!--
<div class="research-meta">
See the full publication list on  
<a href="https://scholar.google.com/citations?user=YOUR_ID" target="_blank" rel="noopener">
Google Scholar
</a>.
</div>
-->

{% assign items = site.research | sort: "date" | reverse %}
<ul>
  {% for doc in items %}
    <li>
      {% if doc.date %}{{ doc.date | date: "%Y-%m-%d" }} — {% endif %}
      <a href="{{ doc.url | relative_url }}">{{ doc.title | default: doc.name }}</a>
    </li>
  {% endfor %}
</ul>