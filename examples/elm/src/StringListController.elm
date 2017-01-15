port module StringListController exposing(..)

import Html exposing (..)
import List exposing (..)

-- input ports
port add_item : (() -> msg) -> Sub msg
port remove_item : (Index -> msg) -> Sub msg
port set_current : (Item -> msg) -> Sub msg

-- output ports
port output_list : List Item -> Cmd msg

main = program { init = init, view = view, update = update, subscriptions = subscriptions }

type alias Item = String
type alias Index = Int
type alias Model = {current: Item, items: List Item}

type Msg = AddItem | RemoveItem Index | SetCurrent Item

initItems = []
initCurrent = ""

init = (Model initCurrent initItems, output_list initItems)

update : Msg -> Model -> (Model, Cmd Msg)
update msg m =
    case msg of
        AddItem ->
            let newItems = m.current::m.items in
            ({m | items = newItems}, output_list newItems)
        RemoveItem i ->
            let newItems = removeAt i m.items in
            ({m | items = newItems}, output_list newItems)
        SetCurrent x ->
            ({m | current = x}, Cmd.none)

view : Model -> Html Msg
view m = text ""

subscriptions : Model -> Sub Msg
subscriptions _ = Sub.batch
    [ remove_item RemoveItem
    , add_item (\_ -> AddItem)
    , set_current SetCurrent
    ]

removeAt : Int -> List a -> List a
removeAt i xs =
    take i xs ++ tailOrNone (drop i xs)

tailOrNone : List a -> List a
tailOrNone xs = case tail xs of
    Nothing -> []
    Just tl -> tl