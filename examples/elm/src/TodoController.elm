port module TodoController exposing(..)

import Html exposing (..)
import List exposing (..)

-- input ports
port set_new : (Item -> msg) -> Sub msg
port add_new : (() -> msg) -> Sub msg
port remove : (Index -> msg) -> Sub msg
port toggle : (Index -> msg) -> Sub msg

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
            ({m | new = x}, output_new x)
        AddNew ->
            let newTodos = (Todo m.new False)::m.todos in
            let newM = {m | todos = newTodos, new = ""} in
            (newM, output newM)
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
    , remove RemoveTodo
    , toggle ToggleTodo
    ]

removeAt : Int -> List a -> List a
removeAt i xs =
    take i xs ++ tailOrNone (drop i xs)

toggleAt : Int -> List Todo -> List Todo
toggleAt i xs =
    List.indexedMap (toggleIf i) xs

tailOrNone : List a -> List a
tailOrNone xs = case tail xs of
    Nothing -> []
    Just tl -> tl

toggleIf : Int -> Int -> Todo -> Todo
toggleIf i j t =
    if (i == j) then {t | done = not t.done} else t