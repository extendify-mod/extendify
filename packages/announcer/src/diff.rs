use std::collections::{HashMap, HashSet};

#[derive(Debug)]
pub struct VecDiff {
    pub added: Vec<String>,
    pub removed: Vec<String>,
}

impl VecDiff {
    pub fn from(old: Vec<String>, new: Vec<String>) -> VecDiff {
        let mut added: Vec<String> = vec![];
        let mut removed: Vec<String> = vec![];

        let all_items: HashSet<_> = old.iter().chain(new.iter()).collect();

        for item in all_items {
            let old_item = old.iter().find(|v| *v == item);
            let new_item = new.iter().find(|v| *v == item);

            if old_item.is_none() && new_item.is_some() {
                added.push(item.to_string());
            } else if old_item.is_some() && new_item.is_none() {
                removed.push(item.to_string());
            }
        }

        VecDiff {
            added: added,
            removed: removed,
        }
    }

    pub fn changed(&self) -> bool {
        !self.added.is_empty() || !self.removed.is_empty()
    }
}

#[derive(Debug)]
pub struct MapDiff {
    pub added: HashMap<String, String>,
    pub removed: HashMap<String, String>,
    pub changed: HashMap<String, MapEntryChange>,
}

impl MapDiff {
    pub fn from(old: HashMap<String, String>, new: HashMap<String, String>) -> Self {
        let mut added = HashMap::<String, String>::new();
        let mut removed = HashMap::<String, String>::new();
        let mut changed = HashMap::<String, MapEntryChange>::new();

        let keys: HashSet<_> = old.keys().chain(new.keys()).collect();

        for key in keys {
            let key = key.clone();
            let old_value = old.get(&key);
            let new_value = new.get(&key);

            if new_value.is_some() && old_value.is_none() {
                added.insert(key, new_value.unwrap().to_string());
            } else if old_value.is_some() && new_value.is_none() {
                removed.insert(key, old_value.unwrap().to_string());
            } else if old_value.is_some()
                && new_value.is_some()
                && (old_value.unwrap() != new_value.unwrap())
            {
                changed.insert(
                    key,
                    MapEntryChange {
                        old: old_value.unwrap().to_string(),
                        new: new_value.unwrap().to_string(),
                    },
                );
            }
        }

        Self {
            added: added,
            removed: removed,
            changed: changed,
        }
    }

    pub fn changed(&self) -> bool {
        !self.added.is_empty() || !self.removed.is_empty() || !self.changed.is_empty()
    }
}

#[derive(Debug)]
pub struct MapEntryChange {
    pub old: String,
    pub new: String,
}
