from langgraph.graph import StateGraph,START,END
from langchain_Schemas import AIMessage,HumanMessage,AnyMessage
from IPython.display import display,Image
from typing import Optional,TypedDict,List,Annotated
import time
import random

#State Schema
class State(TypedDict):
    messages: List[AnyMessage]

#Processor Node Function
def process_query(oldState:State)->State:
    """
    Takes user query,processes it and returns the response back to the user
    """
    newState=State()
    newState.messages.append(HumanMessage("Hi I am good"))
    return newState

#Graph builder
graph_builder=StateGraph()
graph_builder.add_node("processor",process_query)
graph_builder.set_entry_point(START)
graph_builder.set_finish_point(END)


#Graph Compilation
graph=graph_builder.compile()

#Displaying Graph in Notebook
# display(Image(graph.get_graph().draw_mermaid_png()))

#Looping queries for chatbot assistance
choices=[        #Multiple questions LLM may ask from user for better user experience
    "Drop your queries here.....",
    "Tell me what do you want to ask",
    "Hey! Ask me if you have any query"
]

terminators=[
    "Allah Hafiz",
    "bye",
    "Good bye"
]
while(True):
    user_prompt=input(random.choice(choices))
    if user_prompt.lower() in terminators:
        print("Okay, good bye! Call me any time if you feel any sort of confusion!")
        break
    user_prompt=HumanMessage(user_prompt)
    graph.invoke({"messages"})

