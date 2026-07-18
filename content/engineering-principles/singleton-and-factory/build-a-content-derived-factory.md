---
id: 269
title: Build a content-derived factory
type: review_task
order: 6
---

A content-derived identifier is computed from an object's own content, so anyone holding the content can recompute the identifier and check it. There is no registry to query and no authority to trust. The same content always produces the same identifier, and any change to the content changes it.

This task asks you to build a small factory that gives each item it creates an identifier derived from that item's content. A second party, holding only the content, must be able to recompute the same identifier and detect any substitution.

Clone the template repository, open the `04-content-derived-factory` folder, and complete the two functions in your chosen language so the demo in the starter passes. In `SOLUTION.md`, explain why a content-derived identifier is a stronger guarantee than an entry in a registry, and what it means that the identifier changes when the content changes. Push your work to your own fork and submit the repository URL.
