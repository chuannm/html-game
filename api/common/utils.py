import random, json

def shuffle_list_with_seed(lst, seed):
    random.seed(seed)
    random.shuffle(lst)
    return lst

def read_json(json_path):
    with open(json_path, "r") as json_file:
        data = json.loads(json_file.read())

        return data

def write_json(json_path, d):
    print(d)
    with open(json_path, "w") as f:
        f.write(json.dumps(d))

        return True
    
