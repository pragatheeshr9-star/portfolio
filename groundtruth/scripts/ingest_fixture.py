from app.core import ingest_pages

PAGES = [
    ("https://docs.python.org/3.12/library/functions.html", """<html><title>Built-in Functions — Python 3.12</title><body><h1>Built-in Functions</h1><h2>len</h2><p>Return the length of an object. The argument may be a sequence or a collection.</p><h2>sorted</h2><p>Return a new sorted list from the items in iterable.</p><h2>open</h2><p>Open file and return a corresponding file object.</p></body></html>"""),
    ("https://docs.python.org/3.12/library/asyncio-task.html", """<html><title>Coroutines and Tasks — Python 3.12</title><body><h1>Coroutines and Tasks</h1><h2>Task Groups</h2><p>Task groups combine a task creation API with a convenient and reliable way to wait for all tasks in the group to finish.</p><table><tr><th>Function</th><th>Purpose</th></tr><tr><td>create_task</td><td>Schedule a coroutine object as a Task.</td></tr></table></body></html>"""),
    ("https://docs.python.org/3.12/tutorial/errors.html", """<html><title>Errors and Exceptions — Python 3.12</title><body><h1>Errors and Exceptions</h1><h2>Handling Exceptions</h2><p>The try statement works as follows: first, the try clause is executed. If no exception occurs, the except clause is skipped.</p><pre>try:\n    pass\nexcept Exception:\n    pass</pre></body></html>"""),
]

if __name__ == "__main__":
    print(f"Indexed {ingest_pages(PAGES)} fixture chunks")
