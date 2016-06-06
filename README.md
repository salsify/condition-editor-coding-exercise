# Product Filtering Condition Editor UI
A Coding Exercise for UI Developers

# Introduction

Many capabilities of Salsify are built around filtered sets of products. Products at Salsify consist of properties and their values. Properties have a datatype.

In order to create filtered sets of products in Salsify we created a condition editor. This editor is used to build a filter that Salsify applies to the full set of products. The resulting set of products, presented as a list, is updated as filters are added or changed.

In order to create a filter condition a user must choose a property, an operation, and one or more values. Due to the differences in property datatypes, not all operations apply to all properties.

To complete this exercise please build a user interface to create a filter and update a list of products to reflect the results. Use the exercise to demonstrate not only a solution to the problem but your approach to software design and testing.

Provide us with an archive containing the results of your work and a README file with a guided tour of your work, notes on your development process, how long you spent on the exercise, what assumptions you made, etc.  If you wish, this may also be presented as a live site.  In that case simply provide a link to the site and the README file mentioned above.

# Specification

This repository contains a mock `datastore` which includes sample products, property definitions including data types, and the complete set of filter operations. Using this datastore please create a web user interface with the following behavior:

* A user can create a single filter
* Filters have the form `[property name] [operator] [property value]`
* Creating or updating a filter causes the the list of products to update

# Tips and Recommendations
- No other Operators or data types will be introduced; they are static.
- Properties and Products vary from customer to customer, you cannot depend on having the same properties or products available each time this application loads

## Properties Types/Operators

Operators define the relationship between properties and property values. Certain operators are only valid for certain property types, operator behavior and valid operators for each property type are defined as follows:

| Operator | Description |
-----------|--------------
| Equals   | Value exactly matches |
| Is greater than | Value is greater than |
| Is less than  | Value is less than |
| Has any value | Value is present |
| Has no value  | Value is absent  |
| Is any of     | Value exactly matches one of several values |
| Contains      | Value contains the specified text |


| Property Type | Valid Operators |
---------------- | ----------------
| string | Equals |
| | Has any value |
| | Has no value |
| | Is any of |
| | Contains |
| number | Equals |
| | Is greater than |
| | Is less than |
| | Has any value |
| | Has no value |
| | Is any of |
| enumerated | equals |
| | Has any value |
| | Has no value |
| | Is any of |
