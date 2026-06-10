import os
from .spotify import *
from .cef import *

def get_project_root() -> str:
    return os.path.join(os.path.dirname(os.path.realpath(__file__)), "../..")

