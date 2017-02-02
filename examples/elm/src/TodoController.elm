port module TodoController exposing(..)

import Html exposing (..)
import List exposing (..)

-- input ports
port set_new : (Item -> msg) -> Sub msg
port add_new : (() -> msg) -> Sub msg
port remove_todo : (Index -> msg) -> Sub msg
port toggle_todo : (Index -> msg) -> Sub msg

-- output ports
port output_list : List Todo -> Cmd msg
port output_new : Item -> Cmd msg

main = program { init = init, view = view, update = update, subscriptions = subscriptions }

type alias Item = String
type alias Todo = {item: Item, done : Bool}
type alias Index = Int
type alias Model = {new: Item, todos: List Todo}

type Msg = SetNew Item | AddNew | RemoveTodo Index | ToggleTodo Index

initTodos = []

init = (Model "" initTodos, output_list initTodos)

update : Msg -> Model -> (Model, Cmd Msg)
update msg m =
    case msg of
        SetNew x ->
            ({m | new = x}, Cmd.none)
        AddNew ->
            let newTodos = (Todo m.new False)::m.todos in
            let newModel = {m | todos = newTodos, new = ""} in
            (newModel, output newModel)
        RemoveTodo i ->
            let newTodos = removeAt i m.todos in
            ({m | todos = newTodos}, output_list newTodos)
        ToggleTodo i ->
            let newTodos = toggleAt i m.todos in
            ({m | todos = newTodos}, output_list newTodos)

output : Model -> Cmd msg
output m =
    Cmd.batch
        [ output_new m.new
        , output_list m.todos ]

view : Model -> Html Msg
view m = text ""

subscriptions : Model -> Sub Msg
subscriptions _ = Sub.batch
    [ set_new SetNew
    , add_new (\_ -> AddNew)
    , remove_todo RemoveTodo
    , toggle_todo ToggleTodo
    ]

removeAt : Int -> List a -> List a
removeAt i xs =
    take i xs ++ tailOrNone (drop i xs)

toggleAt : Int -> List Todo -> List Todo
toggleAt i xs =
    List.indexedMap (forIndex i toggle) xs

tailOrNone : List a -> List a
tailOrNone xs = case tail xs of
    Nothing -> []
    Just tl -> tl

toggle : Todo -> Todo
toggle t
    = {t | done = not t.done}

forIndex : Int -> (a -> a) -> Int -> a -> a
forIndex i f j a =
    if (i == j) then f a else a