# condition-view-coding-exercise
A Coding Exercise for UI Developers

# Introduction

Many capabilites of Salsify are built around filtered sets of products.  Products at salsify consist of properties and their values.  Properties can be of several types.

In order to create filtered sets of products in Salsify we have created a condition editor.  This editor is used to build a filter that Salsify applies to the full set of products.  The result is displayed _live_ as filters are added.

Due to the differences in property data types, not all operations apply to all properties.

In this exercise we would like to build a user interface that creates a filter and causes a list of products to update to reflect the results.

# Specification

Your code should, given a set of property data:
* Present a web user interface that allows the creation of filters of the form `[property name] [comparator] [property value]`
* Updates a view of products to reflect the new criteria

## Properties Types/Comparators

Comparators define the relationship between properties and property values. Certain comparators are only valid for certain property types, valid comparators for each property type are defined as follows:

* string
 * equals
 * any
 * none
 * in
* number
 * equals
 * greater_than
 * less_than
 * any
 * none
 * in
* enumerated
 * equals
 * any
 * none
 * in

## Views

We recommend splitting the UI for this project into 2 views; one for the condition editor and one for the products list. The view responsible for the products list need only display some status for the current filter state, we are mainly interested in seeing how you design the condition editor and the interface between the views.


## Data

We have provided you with a `datastore` with all the data you need to build your condition editor.
