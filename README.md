# condition-view-coding-exercise
A Coding Exercise for UI Developers

# Introduction

Many capabilites of Salsify are built around filtered sets of products. Products at Salsify consist of properties and their values. Properties have a datatype.

In order to create filtered sets of products in Salsify we created a condition editor. This editor is used to build a filter that Salsify applies to the full set of products. The resulting set of products, presented in a product index view, is updated as filters are added or changed.

In order to create a filter condition a user must choose a property, an operation, and one or more values. Due to the differences in property datatypes, not all operations apply to all properties.

In this exercise we would like to build a user interface to create a filter and update a list of products to reflect the results.

# Specification

This repository contains a mock `datastore` which includes sample products, propderty definitions including data types, and the complete set of filter operations. Using this datastore please create a web user inteface with the following behavior:

* A user can create a single filter
* Filters have the form `[property name] [comparator] [property value]`
* Creating or updating a filter causes the the view of products to update

# Non-requirements
For the purpose of this exercise it is _not necessary to properly filter the products_. Simply demonstrating that the product list changes and that it has knowledge of the current filter is sufficient.

## Properties Types/Comparators

Comparators define the relationship between properties and property values. Certain comparators are only valid for certain property types, valid comparators for each property type are defined as follows:

| Property Type | Valid Operations |
---------------- | ----------------
| string | equals (value exactly matches) |
| | any (value is present) |
| | none (value is absent) |
| | in (value exactly matches one of several values)|
| number | equals |
| | greater_than |
| | less_than |
| | any |
| | none |
| | in |
| enumerated | equals |
| | any |
| | none |
| | in |

## Recommendations

We recommend splitting the UI for this project into 2 views; one for the condition editor and one for the products list. The view responsible for the products list need only display some status for the current filter state, we are mainly interested in seeing how you design the condition editor and the interface between the views.
